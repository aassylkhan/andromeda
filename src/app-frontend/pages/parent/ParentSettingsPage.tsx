import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { useAppAuthStore } from '../../store/appAuthStore'
import { AppShell } from '../../components/AppShell'
import { LogoutConfirmDialog } from '../../components/LogoutConfirmDialog'
import { formatPhoneForUi } from '../../../shared/utils/phoneUtils'

export const ParentSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, loading, loadMe, logout } = useAppAuthStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!user) loadMe()
  }, [user, loadMe])

  const handleLogout = async () => {
    setConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1.5,
            borderBottom: '1px solid rgba(145,158,171,0.16)',
            bgcolor: '#FFFFFF',
          }}
        >
          <IconButton
            aria-label="Назад"
            onClick={() => navigate('/parent', { replace: true })}
            sx={{ color: '#637381' }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Настройки
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!user ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonOutlineRoundedIcon sx={{ color: '#637381' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ФИО
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {user.lastName} {user.firstName}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneOutlinedIcon sx={{ color: '#637381' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Номер телефона
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {user.phoneNumber ? formatPhoneForUi(user.phoneNumber) : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<LogoutRoundedIcon />}
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
                sx={{ minHeight: 48 }}
              >
                Выйти
              </Button>
            </>
          )}
        </Box>
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
