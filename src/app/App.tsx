import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './router'
import { AppFrontendRoot } from '../app-frontend/routes/AppFrontendRoot'

/**
 * Determines whether the current page is the parent/student app frontend
 * (app.andromeda.kz) or the employee CRM (yadro.andromeda.kz).
 *
 * Detection order:
 *  1. Build-time override via VITE_APP_MODE = 'app' | 'crm' (used by docker-compose/CI).
 *  2. Hostname inspection (works for both prod and local hosts file setups).
 */
function isAppFrontend(): boolean {
  const buildMode = import.meta.env.VITE_APP_MODE
  if (buildMode === 'app') return true
  if (buildMode === 'crm') return false

  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  if (!host) return false
  if (host === 'app.andromeda.kz' || host === 'app.andromedaedu.kz') return true
  if (host.startsWith('app.')) return true
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
