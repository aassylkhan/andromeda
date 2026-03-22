import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import { RocketLogo } from '../../components/RocketLogo'
import { useAuthStore } from '../../entities/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { sendCode, loading, error, clearError } = useAuthStore()
  const [phoneDigits, setPhoneDigits] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setPhoneDigits(digits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!phoneDigits.trim()) return

    try {
      await sendCode(`+${phoneDigits}`)
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
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            border: '1px solid rgba(145, 158, 171, 0.16)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <RocketLogo size={80} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Вход в платформу для сотрудников
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Введите номер телефона для получения кода
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Номер телефона"
              type="text"
              placeholder="7XXXXXXXXXX"
              value={phoneDigits}
              onChange={handlePhoneChange}
              disabled={loading}
              sx={{ mb: 3 }}
              autoFocus
              required
              inputProps={{
                inputMode: 'tel',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0 }}>
                    <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>+</Typography>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !phoneDigits.trim()}
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Получить код'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}
