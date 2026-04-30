import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import { useAppAuthStore } from '../store/appAuthStore'
import { AppShell } from '../components/AppShell'

export const AppCodePage: React.FC = () => {
  const navigate = useNavigate()
  const { phoneNumber, login, loading, error, clearError } = useAppAuthStore()
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login', { replace: true })
    }
  }, [phoneNumber, navigate])

  const handleCodeChange = (val: string) => {
    setCode(val.replace(/\D/g, '').slice(0, 6))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!phoneNumber || code.length !== 6) return
    try {
      const flow = await login(phoneNumber, code)
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
        case 'SELECT_MODE':
          navigate('/select-mode', { replace: true })
          break
      }
    } catch {
      // error is already set in the store
    }
  }

  if (!phoneNumber) return null

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
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Введите код
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Отправили на WhatsApp +{phoneNumber}
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
            label="6-значный код"
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={loading}
            autoFocus
            inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ShieldRoundedIcon sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="text" size="small" onClick={() => navigate('/login')}>
              Изменить номер
            </Button>
          </Stack>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || code.length !== 6}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
          </Button>
        </Box>
      </Box>
    </AppShell>
  )
}
