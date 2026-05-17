import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Stack, Typography } from '@mui/material'
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import { useAppAuthStore } from '../store/appAuthStore'
import { AppShell } from '../components/AppShell'
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog'

export const AppNoChildrenPage: React.FC = () => {
  const navigate = useNavigate()
  const { logout, loading } = useAppAuthStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleLogout = async () => {
    setConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      <Box
        sx={{
          flex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
          gap: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            bgcolor: 'rgba(24,119,242,0.10)',
            color: '#1877F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FamilyRestroomRoundedIcon sx={{ fontSize: 56 }} />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Похоже, к вам не привязали аккаунт вашего ребёнка
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          Обратитесь к своему куратору, чтобы он привязал ученика. После этого вы сможете
          пользоваться приложением.
        </Typography>

        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 280 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonOutlineRoundedIcon />}
            onClick={() => navigate('/parent/settings')}
            sx={{ minHeight: 48 }}
          >
            Мой профиль
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            sx={{ minHeight: 48 }}
          >
            Выйти
          </Button>
        </Stack>
      </Box>

      <LogoutConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        loading={loading}
      />
    </AppShell>
  )
}
