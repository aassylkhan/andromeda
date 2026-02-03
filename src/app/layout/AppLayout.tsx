import React, { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  ListItem,
  ListItemButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'

import logo from '../../assets/Yadro by Andromeda-4.png'
import { useAuthStore } from '../../entities/auth'

const DRAWER_WIDTH = 300

// Bigger Newton-like menu
const NAV = {
  bg: '#FFFFFF',
  border: 'rgba(145, 158, 171, 0.12)',

  itemHeight: 54,
  iconSize: 26,
  iconBox: 40,
  fontSize: 16,

  itemColor: 'rgba(99, 115, 129, 1)', // #637381
  itemActiveColor: 'rgba(33, 43, 54, 1)', // #212B36

  itemHoverBg: 'rgba(145, 158, 171, 0.12)',
  itemActiveBg: 'rgba(145, 158, 171, 0.20)',
}

// Мягкий фон под логотип (мутный, не кислотный)
const BRAND_BG = `
  radial-gradient(1200px 740px at 18% 12%, rgba(37, 41, 101, 0.10), transparent 60%),
  radial-gradient(980px 720px at 82% 18%, rgba(75, 42, 100, 0.09), transparent 62%),
  radial-gradient(1150px 820px at 46% 92%, rgba(201, 96, 107, 0.10), transparent 58%),
  #F6F7FB
`

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => (s as any).logout)

  const handleDrawerToggle = () => setMobileOpen((v) => !v)

  const menuItems: Array<{
    label: string
    icon: React.ReactNode
    path: string
    sectionKey?: keyof NonNullable<typeof user>['sections']
  }> = useMemo(
    () => [
      {
        label: 'Сотрудники',
        icon: <PeopleAltOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/employees',
        sectionKey: 'employees',
      },
      {
        label: 'Мои сессии',
        icon: <EventNoteOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/my-sessions',
        sectionKey: 'mySessions',
      },
      {
        label: 'Все сессии',
        icon: <ListAltOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/sessions',
        sectionKey: 'admin',
      },
    ],
    []
  )

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.sectionKey) return true
      return Boolean(user?.sections?.[item.sectionKey])
    })
  }, [menuItems, user])

  const renderNavItem = (
    item: { label: string; icon: React.ReactNode; path: string },
    onClick?: () => void
  ) => {
    const isActived = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

    return (
      <ListItem disableGutters disablePadding key={item.label}>
        <ListItemButton
          disableGutters
          disableRipple
          disableTouchRipple
          onClick={() => {
            if (onClick) onClick()
            else navigate(item.path)
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            px: 1.5,
          
            py: 1.25,
            gap: 2,
            borderRadius: 1.2,

            minHeight: `${NAV.itemHeight}px`,
            fontSize: NAV.fontSize,
            lineHeight: '24px',

            fontWeight: isActived ? 700 : 600,
            color: isActived ? NAV.itemActiveColor : NAV.itemColor,

            '&:hover': { bgcolor: NAV.itemHoverBg },

            ...(isActived && {
              bgcolor: NAV.itemActiveBg,
              '&:hover': { bgcolor: NAV.itemHoverBg },
            }),
          }}
        >
          <Box
            component="span"
            sx={{
              width: NAV.iconBox,
              height: NAV.iconBox,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </Box>

          <Box component="span" sx={{ flexGrow: 1 }}>
            {item.label}
          </Box>
        </ListItemButton>
      </ListItem>
    )
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ mb: 2 }}>
        <Box
          component="img"
          src={logo}
          alt="Andromeda"
          onClick={() => {
            navigate('/employees')
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            height: 120,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'block',
          }}
        />
      </Box>

      {/* Menu */}
      <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column">
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }} gap={0.75} display="flex" flexDirection="column">
          {visibleMenuItems.map((item) => renderNavItem(item))}
        </Box>
      </Box>

      {/* Bottom (profile + actions) */}
      <Box sx={{ mt: 2 }}>
        {user && (
          <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {(user.firstName?.[0] ?? '').toUpperCase()}
              {(user.lastName?.[0] ?? '').toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 800, fontSize: 14.5, lineHeight: '20px' }}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
              </Typography>

              <Typography noWrap sx={{ fontSize: 13.5 }} color="text.secondary">
                {user.phoneNumber ?? user.email ?? '—'}
              </Typography>
            </Box>
          </Box>
        )}

        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }} gap={0.75} display="flex" flexDirection="column">
          {renderNavItem(
            {
              label: 'Мои данные',
              icon: <SettingsOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
              path: '/__settings',
            },
            () => setSettingsOpen(true)
          )}

          {renderNavItem(
            {
              label: 'Выйти',
              icon: <LogoutRoundedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
              path: '/__logout',
            },
            async () => {
              try {
                if (typeof logout === 'function') await logout()
                else {
                  localStorage.removeItem('accessToken')
                  localStorage.removeItem('refreshToken')
                }
              } finally {
                navigate('/login')
              }
            }
          )}
        </Box>
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
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        bgcolor: '#F6F7FB',
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          background: BRAND_BG,
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <CssBaseline />

      {/* Всё поверх фона */}
      <Box sx={{ display: 'flex', flex: 1, width: '100%', position: 'relative', zIndex: 1 }}>
        {isMobile && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              bgcolor: NAV.bg,
              borderBottom: `1px solid ${NAV.border}`,
              color: NAV.itemActiveColor,
            }}
          >
            <Toolbar sx={{ minHeight: 64, display: 'flex', gap: 1 }}>
              <IconButton onClick={handleDrawerToggle} edge="start" sx={{ color: NAV.itemActiveColor }}>
                <MenuIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Andromeda CRM</Typography>
            </Toolbar>
          </AppBar>
        )}

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
                  pt: 2.5,
                  px: 2.5,
                  overflow: 'unset',
                  width: DRAWER_WIDTH,
                  bgcolor: NAV.bg, // Drawer всегда белый
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
                  pt: 2.5,
                  px: 2.5,
                  overflow: 'unset',
                  width: DRAWER_WIDTH,
                  bgcolor: NAV.bg, // Drawer всегда белый
                  borderRight: `1px solid ${NAV.border}`,
                },
              }}
            >
              {drawerContent}
            </Drawer>
          )}
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            pt: isMobile ? 10 : 3,
            px: 3,
            pb: 3,
          }}
        >
          <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
            <Outlet />
          </Box>
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
