import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Paper, Typography, Button } from '@mui/material'
import { getAccessToken } from '../../shared/api/tokens'
import { useAuthStore } from '../../entities/auth'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import type { UserSections } from '../../entities/auth/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requiredSections?: (keyof UserSections)[]
}

export function ProtectedRoute({ children, requiredRoles, requiredSections }: ProtectedRouteProps) {
  const { user, loading, loadMe } = useAuthStore()
  const token = getAccessToken()

  useEffect(() => {
    if (token && !user && !loading) {
      loadMe()
    }
  }, [token, user, loading, loadMe])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading || !user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  const lacksSectionAccess = requiredSections?.length
    ? !requiredSections.some((section) => user.sections?.[section])
    : false

  const lacksRoleAccess = requiredRoles?.length
    ? !hasAnyRole(user, requiredRoles)
    : false

  if (lacksSectionAccess || lacksRoleAccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 2,
        }}
      >
        <Paper
          sx={{
            textAlign: 'center',
            p: 4,
            maxWidth: 500,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Нет доступа
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            У вас недостаточно прав для доступа к этому разделу.
          </Typography>
          <Button
            variant="contained"
            onClick={() => (window.location.href = '/')}
          >
            На главную
          </Button>
        </Paper>
      </Box>
    )
  }

  // Пользователь загружен - показываем контент
  return <>{children}</>
}
