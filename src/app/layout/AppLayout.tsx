import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
} from '@mui/icons-material'
import logo from '../../assets/Yadro by Andromeda-4.png'
import { useAuthStore } from '../../entities/auth'

const DRAWER_WIDTH = 300

// Newton tokens
const NAV = {
  bg: '#FFFFFF',
  border: 'rgba(145,158,171,0.08)',
  itemHeight: 44,
  itemRadius: 6,
  itemColor: '#637381',
  activeColor: '#1877F2',
  activeBg: 'rgba(24,119,242,0.08)',
  hoverBg: 'rgba(24,119,242,0.16)',
}

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const handleDrawerToggle = () => setMobileOpen((v) => !v)

  const menuItems: Array<{
    label: string
    icon: React.ReactNode
    path: string
    sectionKey?: keyof NonNullable<typeof user>['sections']
  }> = [
    { label: 'Сотрудники', icon: <PeopleIcon />, path: '/employees', sectionKey: 'employees' },
    { label: 'Мои сессии', icon: <EventNoteIcon />, path: '/my-sessions', sectionKey: 'mySessions' },
    { label: 'Все сессии', icon: <ListAltIcon />, path: '/sessions', sectionKey: 'admin' },
  ]

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.sectionKey) return true
    return Boolean(user?.sections?.[item.sectionKey])
  })

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box
        sx={{
          px: 2.5, // 20px
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
          onClick={() => navigate('/employees')}
          sx={{
            width: '100%',
            maxWidth: 290,
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />
      </Box>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Мои данные</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            Просмотр информации вашего профиля.
          </DialogContentText>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
          <Button onClick={() => setSettingsOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2.5, py: 1 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                    minHeight: NAV.itemHeight,
                    borderRadius: `${NAV.itemRadius}px`,
                    pl: 2,   // 16px
                    pr: 1.5, // 12px
                    py: 1,   // 8px
                    gap: 2,  // 16px
                    color: NAV.itemColor,
                    '&:hover': { bgcolor: NAV.hoverBg },

                    '&.Mui-selected, &.Mui-selected:hover': {
                      bgcolor: NAV.activeBg,
                      color: NAV.activeColor,
                      fontWeight: 600,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      width: 24,
                      height: 24,
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
                      fontWeight: selected ? 600 : 500,
                      lineHeight: '22px',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Bottom actions */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: `1px solid ${NAV.border}`,
          display: 'flex',
          gap: 1,
        }}
      >
        <IconButton
          onClick={() => setSettingsOpen(true)}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            color: NAV.itemColor,
            bgcolor: 'rgba(145,158,171,0.08)',
            '&:hover': { bgcolor: 'rgba(145,158,171,0.12)' },
          }}
          aria-label="Мои данные"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>

        <ListItemButton
          onClick={() => {
            localStorage.clear()
            navigate('/login')
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            minHeight: 44,
            borderRadius: 2,
            px: 2,
            gap: 2,
            flex: 1,
            color: '#B71D18',
            '&:hover': { bgcolor: 'rgba(255,86,48,0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, width: 24, height: 24, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Выйти"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#F9FAFB', // ✅ Newton: без overlay/прозрачности
      }}
    >
      <CssBaseline />

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
                bgcolor: NAV.bg,
                borderRight: `1px solid ${NAV.border}`,
              },
            }}
          >
            {drawer}
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
                bgcolor: NAV.bg,
                borderRight: `1px solid ${NAV.border}`,
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ color: 'text.secondary' }}>{label}</Box>
      <Box sx={{ textAlign: 'right' }}>{value}</Box>
    </Box>
  )
}
