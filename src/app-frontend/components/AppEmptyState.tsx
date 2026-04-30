import React from 'react'
import { Box, Typography } from '@mui/material'

interface AppEmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({ icon, title, message }) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 3,
      py: 6,
      gap: 1.5,
      textAlign: 'center',
      color: 'text.secondary',
    }}
  >
    {icon && (
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'rgba(24,119,242,0.08)',
          color: '#1877F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        {icon}
      </Box>
    )}
    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
      {title}
    </Typography>
    {message && (
      <Typography variant="body2" sx={{ maxWidth: 320 }}>
        {message}
      </Typography>
    )}
  </Box>
)
