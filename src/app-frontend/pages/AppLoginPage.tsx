import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import { useAppAuthStore } from '../store/appAuthStore'
import { getAppAccessToken } from '../api/appTokens'
import { AppShell } from '../components/AppShell'

export const AppLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { sendCode, loading, error, clearError, user } = useAppAuthStore()
  const [phoneDigits, setPhoneDigits] = useState('')
  const token = getAppAccessToken()

  // Already authenticated — redirect to the app instead of showing login form.
  if (token && user) {
    switch (user.mode) {
      case 'APP_PARENT':
        return <Navigate to="/parent" replace />
      case 'APP_STUDENT':
        return <Navigate to="/student/schedule" replace />
      case 'APP_PENDING_SELECT':
        return <Navigate to="/select-mode" replace />
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15)
    setPhoneDigits(digits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!phoneDigits.trim()) return
    try {
      await sendCode(phoneDigits)
      navigate('/login/code')
    } catch {
      // error is already set in the store
    }
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
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            bgcolor: 'rgba(24,119,242,0.10)',
            color: '#1877F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RocketLaunchRoundedIcon sx={{ fontSize: 56 }} />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Веб приложение
          </Typography>
          <Typography variant="body2" color="text.secondary">
            для родителей и учеников
          </Typography>
        </Box>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Номер телефона"
            type="text"
            placeholder="___________"
            value={phoneDigits}
            onChange={handlePhoneChange}
            disabled={loading}
            autoFocus
            inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: 'text.primary', userSelect: 'none' }}
                  >
                    +
                  </Typography>
                </InputAdornment>
              ),
            }}
          />

          <Stack spacing={1.5}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || phoneDigits.length < 10}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Получить код'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </AppShell>
  )
}
