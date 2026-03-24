import { useState } from 'react'
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
const logo = '/YadroSide.png'
import { useAuthStore } from '../../entities/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { sendCode, loading, error, clearError } = useAuthStore()
  const [phoneDigits, setPhoneDigits] = useState('')

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
      // error is set in store
    }
  }

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
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src={logo}
            alt="Ядро by Андромеда"
            sx={{ height: 48, width: 'auto', mb: 2, display: 'inline-block' }}
          />
          <Typography variant="h4" sx={{ mb: 1 }}>
            Вход в платформу для сотрудников
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Введите номер телефона для получения кода
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Номер телефона"
                  type="text"
                  placeholder="___________"
                  value={phoneDigits}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  autoFocus
                  inputProps={{ inputMode: 'tel' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>+</Typography>
                      </InputAdornment>
                    ),
                  }}
                />

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
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
