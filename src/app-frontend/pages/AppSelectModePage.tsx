import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import { useAppAuthStore } from '../store/appAuthStore'
import { AppShell } from '../components/AppShell'

export const AppSelectModePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, selectMode, loading, error, clearError, loadMe } = useAppAuthStore()

  useEffect(() => {
    if (!user) {
      loadMe()
    }
  }, [user, loadMe])

  useEffect(() => {
    if (user && user.mode !== 'APP_PENDING_SELECT') {
      // Already selected → redirect
      if (user.mode === 'APP_PARENT') navigate('/parent', { replace: true })
      else if (user.mode === 'APP_STUDENT') navigate('/student/schedule', { replace: true })
    }
  }, [user, navigate])

  const handleSelect = async (mode: 'PARENT' | 'STUDENT') => {
    clearError()
    try {
      const flow = await selectMode(mode)
      switch (flow) {
        case 'PARENT':
          navigate('/parent', { replace: true })
          break
        case 'PARENT_NO_CHILDREN':
          navigate('/parent/no-children', { replace: true })
          break
        case 'STUDENT':
          navigate('/student/schedule', { replace: true })
          break
        default:
          break
      }
    } catch {
      // error in store
    }
  }

  if (!user) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Box
        sx={{
          flex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
          gap: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Здравствуйте, {user.lastName} {user.firstName}!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Выберите, как вы хотите войти
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', maxWidth: 360 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<FamilyRestroomRoundedIcon />}
            onClick={() => handleSelect('PARENT')}
            disabled={loading}
            sx={{ minHeight: 56, justifyContent: 'flex-start', pl: 2 }}
          >
            Войти как родитель
          </Button>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="secondary"
            startIcon={<SchoolRoundedIcon />}
            onClick={() => handleSelect('STUDENT')}
            disabled={loading}
            sx={{ minHeight: 56, justifyContent: 'flex-start', pl: 2 }}
          >
            Войти как ученик
          </Button>
        </Stack>
      </Box>
    </AppShell>
  )
}
