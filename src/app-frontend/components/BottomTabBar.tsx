import React from 'react'
import { Box, Paper } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

export interface BottomTab {
  key: string
  label: string
  icon: React.ReactNode
  path: string
}

interface BottomTabBarProps {
  tabs: BottomTab[]
}

/**
 * Fixed bottom tab bar used by both parent and student app interfaces.
 * Sticky at the bottom of the viewport via fixed positioning so it does not
 * disappear on scroll (per ТЗ).
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 20,
        borderTop: '1px solid rgba(145,158,171,0.20)',
        bgcolor: '#FFFFFF',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 0.5 }}>
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
          return (
            <Box
              key={tab.key}
              role="button"
              tabIndex={0}
              onClick={() => navigate(tab.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(tab.path)
                }
              }}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
                py: 1,
                cursor: 'pointer',
                userSelect: 'none',
                color: isActive ? '#1877F2' : '#637381',
                transition: 'color 0.15s ease',
                '&:hover': { color: '#1877F2' },
                outline: 'none',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {tab.icon}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1.2,
                }}
              >
                {tab.label}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}
