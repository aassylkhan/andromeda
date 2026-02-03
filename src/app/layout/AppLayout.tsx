import React, { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  People as PeopleIcon,
  Logout as LogoutIcon,
  EventNote as EventNoteIcon,
  ListAlt as ListAltIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'
import logo from '../../assets/Yadro by Andromeda-4.png'
import { useAuthStore } from '../../entities/auth'

const DRAWER_WIDTH = 300

// Newton-ish tokens
const TOKENS = {
  pageBg: '#F6F7FB',
  drawerBg: '#FFFFFF',
  divider: 'rgba(15, 23, 42, 0.08)',
  text: 'rgba(15, 23, 42, 0.78)',
  muted: 'rgba(15, 23, 42, 0.52)',
  active: '#2563EB',
  activeBg: 'rgba(37, 99, 235, 0.10)',
  hoverBg: 'rgba(37, 99, 235, 0.08)',
  softBtnBg: 'rgba(15, 23, 42, 0.06)',
  softBtnBgHover: 'rgba(15, 23, 42, 0.09)',
}

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => (s as any).logout) // если есть logout() в сторе

  const handleDrawerToggle = () => setMobileOpen((v) => !v)

  const menuItems: Array<{
    label: string
    icon: React.ReactNode
    path: string
    sectionKey?: keyof NonNullable<typeof user>['sections']
  }> = useMemo(
    () => [
      { label: 'Сотрудники', icon: <PeopleIcon fontSize="small" />, path: '/employees', sectionKey: 'employees' },
      { label: 'Мои сессии', icon: <EventNoteIcon fontSize="small" />, path: '/my-sessions', sectionKey: 'mySessions' },
      { label: 'Все сессии', icon: <ListAltIcon fontSize="small" />, path: '/sessions', sectionKey: 'admin' },
    ],
    []
  )

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.sectionKey) return true
      return Boolean(user?.sections?.[item.sectionKey])
    })
  }, [menuItems, user])

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Andromeda"
          onClick={() => {
            navigate('/employees')
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            width: '100%',
            maxWidth: 280,
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        />
      </Box>

      <Divider sx={{ borderColor: TOKENS.divider }} />

      {/* Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2.5, py: 1.5 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {visibleMenuItems.map((item) => {
            const selected = location.pathname === item.path

            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path)
                    if (isMobile) setMobileOpen(false)
                  }}
                  selected={selected}
                  sx={{
                    minHeight: 46,
                    borderRadius: 2,
                    px: 2,
                    gap: 1.75,
                    color: TOKENS.text,

                    '&:hover': { bgcolor: TOKENS.hoverBg },

                    '&.Mui-selected, &.Mui-selected:hover': {
                      bgcolor: TOKENS.activeBg,
                      color: TOKENS.active,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: selected ? 700 : 600,
                      lineHeight: '22px',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: TOKENS.divider }} />

      {/* Bottom actions */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <IconButton
          onClick={() => setSettingsOpen(true)}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            color: TOKENS.muted,
            bgcolor: TOKENS.softBtnBg,
            '&:hover': { bgcolor: TOKENS.softBtnBgHover },
          }}
          aria-label="Мои данные"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>

        <Button
          onClick={async () => {
            try {
              // предпочтительно: корректный logout (удаление токенов, /logout и т.п.)
              if (typeof logout === 'function') {
                await logout()
              } else {
                // fallback если logout нет
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
              }
            } finally {
              navigate('/login')
              if (isMobile) setMobileOpen(false)
            }
          }}
          variant="text"
          startIcon={<LogoutIcon fontSize="small" />}
          sx={{
            flex: 1,
            height: 44,
            borderRadius: 2,
            justifyContent: 'flex-start',
            px: 2,
            color: '#B42318',
            bgcolor: 'rgba(180, 35, 24, 0.06)',
            '&:hover': { bgcolor: 'rgba(180, 35, 24, 0.10)' },
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Выйти
        </Button>
      </Box>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Мои данные</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2, color: 'text.secondary' }}>
            Просмотр информации вашего профиля.
          </DialogContentText>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Row label="ID" value={user?.userId ?? '—'} />
            <Row label="Фамилия" value={user?.lastName ?? '—'} />
            <Row label="Имя" value={user?.firstName ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Телефон" value={user?.phoneNumber ?? '—'} />
            <Row label="Роли" value={user?.roles?.join(', ') ?? '—'} />
            <Row
              label="Доступ"
              value={
                user?.sections
                  ? Object.entries(user.sections)
                      .filter(([, val]) => val)
                      .map(([key]) => key)
                      .join(', ') || '—'
                  : '—'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: TOKENS.pageBg }}>
      <CssBaseline />

      {/* Mobile top bar (если у тебя уже есть свой AppBar — можешь убрать этот блок) */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: TOKENS.drawerBg,
            borderBottom: `1px solid ${TOKENS.divider}`,
            color: TOKENS.text,
          }}
        >
          <Toolbar sx={{ minHeight: 64, display: 'flex', gap: 1 }}>
            <IconButton onClick={handleDrawerToggle} edge="start" sx={{ color: TOKENS.text }}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 800 }}>Andromeda CRM</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                bgcolor: TOKENS.drawerBg,
                borderRight: `1px solid ${TOKENS.divider}`,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                bgcolor: TOKENS.drawerBg,
                borderRight: `1px solid ${TOKENS.divider}`,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          // если есть мобильный AppBar — отступ сверху
          pt: isMobile ? 10 : 3,
          px: 3,
          pb: 3,
        }}
      >
        {/* Контент можно ограничить как в Newton */}
        <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ textAlign: 'right', fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}
