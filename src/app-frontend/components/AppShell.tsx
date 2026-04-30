import React from 'react'
import { Box } from '@mui/material'

/**
 * Mobile-first container that centers content into a phone-friendly width
 * and avoids ugly stretching on desktops.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100dvh',
      bgcolor: '#F4F6F8',
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        bgcolor: '#FFFFFF',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: { xs: 'none', sm: '0 0 0 1px rgba(145,158,171,0.16)' },
      }}
    >
      {children}
    </Box>
  </Box>
)
