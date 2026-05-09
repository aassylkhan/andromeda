import React, { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  ListItem,
  ListItemButton,
  Toolbar,
  Typography,
  AppBar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'

const logo = '/YadroSide.png'
import { useAuthStore } from '../../entities/auth'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'

const DRAWER_WIDTH = 300

const NAV = {
  bg: '#ffffff',
  border: 'rgba(145, 158, 171, 0.12)',
  itemHeight: 44,
  iconSize: 24,
  itemColor: '#637381',
  itemActiveColor: '#1877F2',
  itemActiveBg: 'rgba(24, 119, 242, 0.08)',
  itemHoverBg: 'rgba(24, 119, 242, 0.04)',
}

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const user = useAuthStore((s) => s.user)
  const logoutFn = useAuthStore((s) => s.logout)

  const menuItems = useMemo(
    () => [
      {
        label: 'Все пользователи',
        icon: <PeopleOutlineIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/users',
        sectionKey: 'allUsers' as const,
      },
      {
        label: 'Сотрудники',
        icon: <BadgeOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/employees',
        sectionKey: 'employees' as const,
      },
      {
        label: 'Ученики',
        icon: <SchoolOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/students',
        sectionKey: 'students' as const,
      },
      {
        label: 'Родители',
        icon: <FamilyRestroomOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/parents',
        sectionKey: 'parents' as const,
      },
      {
        label: 'Бухгалтерия',
        icon: <AccountBalanceOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/accounting',
        sectionKey: 'accounting' as const,
      },
      {
        label: 'Оффлайн расписание',
        icon: <CalendarMonthOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/offline-schedule',
        sectionKey: 'offlineSchedule' as const,
      },
      {
        label: 'Слоты',
        icon: <GridViewOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/slots',
        sectionKey: 'slots' as const,
      },
      {
        label: 'Сессии входа',
        icon: <DevicesOutlinedIcon sx={{ width: NAV.iconSize, height: NAV.iconSize }} />,
        path: '/sessions',
        sectionKey: 'mySessions' as const,
      },
    ],
    []
  )

  const visibleMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        if (!item.sectionKey) return true
        return Boolean(user?.sections?.[item.sectionKey])
      }),
    [menuItems, user]
  )

  const handleLogout = async () => {
    setLogoutDialogOpen(false)
    try {
      await logoutFn()
    } finally {
      navigate('/login')
    }
  }

  const renderNavItem = (item: { label: string; icon: React.ReactNode; path: string }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

    return (
      <ListItem disableGutters disablePadding key={item.label}>
        <ListItemButton
          disableGutters
          onClick={() => {
            navigate(item.path)
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            pl: 2,
            py: 1,
            gap: 2,
            pr: 1.5,
            borderRadius: 0.75,
            typography: 'body2',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? NAV.itemActiveColor : NAV.itemColor,
            minHeight: `${NAV.itemHeight}px`,
            bgcolor: isActive ? NAV.itemActiveBg : 'transparent',
            '&:hover': { bgcolor: isActive ? NAV.itemActiveBg : NAV.itemHoverBg },
          }}
        >
          <Box component="span" sx={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2.5, px: 2.5 }}>
      {/* Logo */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Box
          component="img"
          src={logo}
          alt="Yadro by Andromeda"
          onClick={() => {
            const first = visibleMenuItems[0]
            navigate(first?.path ?? '/')
            if (isMobile) setMobileOpen(false)
          }}
          sx={{
            height: 36,
            width: 'auto',
            maxWidth: 220,
            objectFit: 'contain',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'block',
          }}
        />
      </Box>

      {/* Menu */}
      <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column">
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }} gap={0.5} display="flex" flexDirection="column">
          {visibleMenuItems.map((item) => renderNavItem(item))}
        </Box>
      </Box>

      {/* Bottom: user info + logout */}
      <Divider sx={{ my: 1.5 }} />

      {user && (
        <Box sx={{ px: 1.5, pb: 0.5, display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 1, width: 40, height: 40, bgcolor: '#1877F2', fontSize: 14 }}>
            {(user.lastName?.[0] ?? '').toUpperCase()}
            {(user.firstName?.[0] ?? '').toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="subtitle2" sx={{ fontWeight: 700 }}>
              {[user.lastName, user.firstName].filter(Boolean).join(' ') || '—'}
              {' '}
              <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                (ID: {user.userId})
              </Typography>
            </Typography>
            <Typography noWrap variant="body2" color="text.secondary">
              {user.phoneNumber ? formatPhoneForUi(user.phoneNumber) : '—'}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 1.5 }}>
        <ListItem disableGutters disablePadding>
          <ListItemButton
            disableGutters
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              pl: 2,
              py: 1,
              gap: 2,
              pr: 1.5,
              borderRadius: 0.75,
              typography: 'body2',
              fontWeight: 500,
              color: NAV.itemColor,
              minHeight: `${NAV.itemHeight}px`,
              '&:hover': { bgcolor: NAV.itemHoverBg },
            }}
          >
            <Box component="span" sx={{ width: 24, height: 24, display: 'inline-flex' }}>
              <LogoutRoundedIcon />
            </Box>
            <Box component="span" flexGrow={1}>
              Выйти
            </Box>
          </ListItemButton>
        </ListItem>
      </Box>

      {/* Logout confirm dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Выход</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Вы уверены, что хотите выйти из системы?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleLogout}>
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      <CssBaseline />

      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: NAV.bg,
            borderBottom: `1px solid ${NAV.border}`,
            color: '#1C252E',
          }}
        >
          <Toolbar sx={{ minHeight: 64, display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setMobileOpen((v) => !v)} edge="start">
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={logo}
              alt="Yadro by Andromeda"
              sx={{ height: 24, width: 'auto', maxWidth: 160, objectFit: 'contain' }}
            />
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                overflow: 'unset',
                width: DRAWER_WIDTH,
                bgcolor: NAV.bg,
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
                overflow: 'unset',
                width: DRAWER_WIDTH,
                bgcolor: NAV.bg,
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
          px: { xs: 2, md: 4 },
          pb: 3,
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
