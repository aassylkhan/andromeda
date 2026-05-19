import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAppAuthStore } from '../store/appAuthStore'
import { getAppAccessToken } from '../api/appTokens'

/**
 * Smart entry point for the PWA (handles `/` and `start_url`).
 *
 * Instead of blindly redirecting to `/login` (which forced a re-login on
 * every PWA launch even when tokens were still valid), this component:
 *
 *  1. Checks if there is an access token in storage.
 *  2. If yes → loads the user profile, then redirects to the correct page
 *     based on the user's mode (parent/student/pending-select).
 *  3. If no → redirects to `/login`.
 */
export const AppEntryRedirect: React.FC = () => {
  const { user, loading, loadMe } = useAppAuthStore()
  const token = getAppAccessToken()

  useEffect(() => {
    if (token && !user && !loading) {
      void loadMe()
    }
  }, [token, user, loading, loadMe])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
        <CircularProgress />
      </Box>
    )
  }

  switch (user.mode) {
    case 'APP_PARENT':
      return <Navigate to="/parent" replace />
    case 'APP_STUDENT':
      return <Navigate to="/student/schedule" replace />
    case 'APP_PENDING_SELECT':
      return <Navigate to="/select-mode" replace />
    default:
      return <Navigate to="/login" replace />
  }
}
