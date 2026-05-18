import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AppProviders } from './providers'
import { router } from './router'
import { AppFrontendRoot } from '../app-frontend/routes/AppFrontendRoot'
import { recoverTokens } from '../shared/api/tokens'
import { recoverAppTokens } from '../app-frontend/api/appTokens'

/**
 * Whitelist of hostnames that should serve the parent/student web app
 * (app.andromeda.kz). All other hostnames serve the employee CRM.
 *
 * Detection priority:
 *  1. Build-time override via VITE_APP_MODE = 'app' | 'crm' (CI / docker-compose).
 *  2. Hostname inspection against the whitelist below.
 *
 * NB: any "app.*" subdomain that is not in the list will serve the employee CRM
 * by default — это намеренно, чтобы preview/dev-домены случайно не открывали
 * мобильное приложение для родителей.
 */
const APP_HOSTNAMES = new Set<string>([
  'app.andromeda.kz',
  'app.andromedaedu.kz',
])

function isAppFrontend(): boolean {
  const buildMode = import.meta.env.VITE_APP_MODE
  if (buildMode === 'app') return true
  if (buildMode === 'crm') return false

  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
  if (!host) return false
  if (APP_HOSTNAMES.has(host)) return true
  if (host === 'app.localhost' || host.startsWith('app.localhost.')) return true
  return false
}

export default function App() {
  const useApp = isAppFrontend()
  const [ready, setReady] = useState(false)

  // On iOS standalone (PWA) mode, localStorage can be wiped between launches.
  // Recover tokens from the more persistent IndexedDB before any route guard
  // checks — otherwise the user gets kicked to /login despite being signed in.
  useEffect(() => {
    const recover = useApp ? recoverAppTokens : recoverTokens
    recover()
      .catch(() => {})
      .finally(() => setReady(true))
  }, [useApp])

  if (!ready) {
    return (
      <AppProviders>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
          <CircularProgress />
        </Box>
      </AppProviders>
    )
  }

  return (
    <AppProviders>
      {useApp ? <AppFrontendRoot /> : <RouterProvider router={router} />}
    </AppProviders>
  )
}
