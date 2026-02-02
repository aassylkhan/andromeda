import { Box, Typography, Paper, Card, CardContent, useTheme } from '@mui/material'
import { People as PeopleIcon, TrendingUp as TrendingUpIcon, Assessment as AssessmentIcon } from '@mui/icons-material'

export function Dashboard() {
  const theme = useTheme()

  const stats = [
    { title: 'Всего сотрудников', value: '0', icon: PeopleIcon, color: theme.palette.primary.main },
    { title: 'Активных', value: '0', icon: TrendingUpIcon, color: theme.palette.success.main },
    { title: 'Отчеты', value: '0', icon: AssessmentIcon, color: theme.palette.secondary.main },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Приветствие */}
      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: 'linear-gradient(135deg, #F54264 0%, #F96741 45%, #FC8C1E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Добро пожаловать в Andromeda
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
          Обзор системы управления сотрудниками
        </Typography>
      </Box>

      {/* Статистика */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Box key={index}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid rgba(145, 158, 171, 0.16)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(245, 66, 100, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        backgroundColor: `${stat.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: 32, color: stat.color }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )
        })}
      </Box>

      {/* Информационная панель */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 2,
          border: '1px solid rgba(145, 158, 171, 0.16)',
          background: 'linear-gradient(135deg, rgba(245, 66, 100, 0.04) 0%, rgba(252, 140, 30, 0.04) 100%)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Быстрый старт
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Система управления сотрудниками Andromeda помогает эффективно организовать работу с персоналом.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Перейдите в раздел "Сотрудники" для начала работы.
        </Typography>
      </Paper>
    </Box>
  )
}
