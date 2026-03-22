import { useState, useEffect } from 'react'
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
  Link,
} from '@mui/material'
import { LockOutlined as LockIcon } from '@mui/icons-material'
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
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Введите код
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Код отправлен на номер {phoneNumber}
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
              label="6-значный код"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              disabled={loading}
              sx={{
                mb: 3,
                '& input': {
                  fontSize: '1.5rem',
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                },
              }}
              autoFocus
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || code.length !== 6}
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ cursor: 'pointer' }}
              >
                Изменить номер телефона
              </Link>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}
