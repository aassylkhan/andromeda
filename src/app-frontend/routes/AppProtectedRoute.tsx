import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAppAuthStore } from '../store/appAuthStore'
import { getAppAccessToken } from '../api/appTokens'
import type { AppMode } from '../api/appAuthApi'

interface AppProtectedRouteProps {
  children: React.ReactNode
  /** Required mode(s). If omitted, any authenticated mode is allowed. */
  requiredModes?: AppMode[]
}

/**
 * Guards app.andromeda.kz pages: ensures user is logged into the app and has
 * the right mode. Redirects unauthenticated users to /login and users with
 * pending mode selection to /select-mode.
 */
export const AppProtectedRoute: React.FC<AppProtectedRouteProps> = ({ children, requiredModes }) => {
  const { user, loading, loadMe } = useAppAuthStore()
  const location = useLocation()
  const token = getAppAccessToken()

  useEffect(() => {
    if (token && !user && !loading) {
      void loadMe()
    }
  }, [token, user, loading, loadMe])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (user.mode === 'APP_PENDING_SELECT') {
    if (location.pathname === '/select-mode') return <>{children}</>
    return <Navigate to="/select-mode" replace />
  }

  if (requiredModes && !requiredModes.includes(user.mode)) {
    if (user.mode === 'APP_PARENT') return <Navigate to="/parent" replace />
    if (user.mode === 'APP_STUDENT') return <Navigate to="/student/schedule" replace />
  }

  return <>{children}</>
}
