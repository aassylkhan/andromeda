import React, { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { BottomTabBar } from '../../components/BottomTabBar'
import type { BottomTab } from '../../components/BottomTabBar'
import { AppShell } from '../../components/AppShell'

export const StudentLayout: React.FC = () => {
  const tabs: BottomTab[] = useMemo(
    () => [
      {
        key: 'schedule',
        label: 'Расписание',
        icon: <CalendarMonthRoundedIcon fontSize="inherit" />,
        path: '/student/schedule',
      },
      {
        key: 'results',
        label: 'Результаты',
        icon: <CheckCircleOutlineRoundedIcon fontSize="inherit" />,
        path: '/student/results',
      },
      {
        key: 'matchmaking',
        label: 'Матчмейкинг',
        icon: <EmojiEventsRoundedIcon fontSize="inherit" />,
        path: '/student/matchmaking',
      },
      {
        key: 'menu',
        label: 'Меню',
        icon: <MenuRoundedIcon fontSize="inherit" />,
        path: '/student/menu',
      },
    ],
    []
  )

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            pb: '88px',
            bgcolor: '#FFFFFF',
          }}
        >
          <Outlet />
        </Box>
        <BottomTabBar tabs={tabs} />
      </Box>
    </AppShell>
  )
}
