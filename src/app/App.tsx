import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './router'
import { AppFrontendRoot } from '../app-frontend/routes/AppFrontendRoot'

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
  // Allow local dev на app.localhost / app.127.0.0.1 для тестов.
  if (host === 'app.localhost' || host.startsWith('app.localhost.')) return true
  return false
}

export default function App() {
  const useApp = isAppFrontend()

  return (
    <AppProviders>
      {useApp ? <AppFrontendRoot /> : <RouterProvider router={router} />}
    </AppProviders>
  )
}
