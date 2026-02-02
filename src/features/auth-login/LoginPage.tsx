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
} from '@mui/material'
import { RocketLogo } from '../../components/RocketLogo'
import { useAuthStore } from '../../entities/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { sendCode, loading, error, clearError } = useAuthStore()
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!phoneNumber.trim()) {
      return
    }

    try {
      await sendCode(phoneNumber)
      navigate('/login/code')
    } catch (error) {
      console.error('Send code error:', error)
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
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(900px 500px at 10% 10%, rgba(37,99,235,.18), transparent 60%),
             radial-gradient(900px 500px at 90% 15%, rgba(34,211,238,.14), transparent 60%),
             radial-gradient(900px 500px at 60% 90%, rgba(167,139,250,.14), transparent 60%)`,
          pointerEvents: 'none',
        },
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
              Вход в систему для сотрудников
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Введите номер WhatsApp для получения кода
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
              label="WhatsApp номер"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
              autoFocus
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !phoneNumber.trim()}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Получить код'
              )}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}
