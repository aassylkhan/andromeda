import { Box, Button, Container, Paper, Typography, Avatar, Divider } from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  EventNote as SessionsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../entities/auth'

export function HomePage() {
  const navigate = useNavigate()
  const { user, logout, loading } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  const { firstName, lastName, email, phoneNumber, sections } = user

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px solid rgba(145, 158, 171, 0.16)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Профиль пользователя */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3,
              }}
            >
              {firstName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {firstName} {lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phoneNumber}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Доступные разделы */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Доступные разделы
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.admin && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AdminIcon />}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 2,
                    px: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                  onClick={() => navigate('/admin')}
                >
                  Админ-панель
                </Button>
              )}

              {sections.employees && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PeopleIcon />}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 2,
                    px: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                  onClick={() => navigate('/employees')}
                >
                  Сотрудники
                </Button>
              )}

              {sections.mySessions && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<SessionsIcon />}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 2,
                    px: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                  onClick={() => navigate('/my-sessions')}
                >
                  Мои сессии
                </Button>
              )}

              {!sections.admin && !sections.employees && !sections.mySessions && (
                <Typography variant="body2" color="text.secondary">
                  У вас нет доступа к разделам системы
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Кнопка выхода */}
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            disabled={loading}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Выйти из системы
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
