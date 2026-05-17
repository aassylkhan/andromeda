import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useAppAuthStore } from '../../store/appAuthStore'
import { LogoutConfirmDialog } from '../../components/LogoutConfirmDialog'
import { formatPhoneForUi } from '../../../shared/utils/phoneUtils'

export const StudentMenuPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, loadMe, logout, loading } = useAppAuthStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!user) loadMe()
  }, [user, loadMe])

  const handleLogout = async () => {
    setConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        px: 3,
        pt: 5,
        pb: 4,
      }}
    >
      <Avatar
        sx={{
          width: 96,
          height: 96,
          bgcolor: 'rgba(24,119,242,0.12)',
          color: '#1877F2',
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        {(user.lastName?.[0] ?? '').toUpperCase()}
        {(user.firstName?.[0] ?? '').toUpperCase()}
      </Avatar>

      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {user.lastName} {user.firstName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user.phoneNumber ? formatPhoneForUi(user.phoneNumber) : '—'}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        startIcon={<CardGiftcardRoundedIcon />}
        endIcon={<ChevronRightRoundedIcon />}
        onClick={() => navigate('/student/referral')}
        sx={{
          mt: 2,
          minHeight: 48,
          width: '100%',
          maxWidth: 300,
          justifyContent: 'flex-start',
          textTransform: 'none',
          fontWeight: 600,
          '& .MuiButton-endIcon': { ml: 'auto' },
        }}
      >
        Реферальная программа
      </Button>

      <Button
        variant="outlined"
        color="primary"
        startIcon={<LogoutRoundedIcon />}
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        sx={{ minHeight: 48, width: '100%', maxWidth: 300 }}
      >
        Выйти
      </Button>

      <LogoutConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        loading={loading}
      />
    </Box>
  )
}
