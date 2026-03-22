import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import { useAuthStore } from '../../entities/auth'

export function CodePage() {
  const navigate = useNavigate()
  const { login, phoneNumber, loading, error, clearError } = useAuthStore()
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login')
    }
  }, [phoneNumber, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!phoneNumber || code.length !== 6) return

    try {
      await login(phoneNumber, code)
      navigate('/')
    } catch {
      // error is set in store
    }
  }

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  if (!phoneNumber) return null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ mx: 'auto', width: 1, maxWidth: 420, px: 2 }}>
        <Typography variant="h4" align="center" sx={{ mb: 2 }}>
          Введите код
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Код отправлен на номер {phoneNumber}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
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
                        <ShieldIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/login')}
                  >
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
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
