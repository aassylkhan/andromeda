import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'

interface MaintenancePageProps {
  resumeTime?: string | null
  message?: string | null
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ resumeTime, message }) => {
  const displayTime = resumeTime ?? ''
  const displayMessage = message
    ?? `Ведутся технические работы, платформа возобновит работу сегодня в ${displayTime}!`

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F9FAFB',
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 520,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <BuildIcon sx={{ fontSize: 64, color: '#1877F2', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Технические работы
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          {displayMessage}
        </Typography>
      </Paper>
    </Box>
  )
}

export default MaintenancePage
