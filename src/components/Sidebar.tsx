import React from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PeopleIcon from '@mui/icons-material/People'
import { useAuthStore } from '../entities/auth'
import { hasAnyRole } from '../shared/utils/roleUtils'
import type { User } from '../entities/auth/types'

interface SidebarProps {
  onLogout: () => void
  activeItem: string
  onMenuClick: (item: string) => void
}

const menuItems = [
  {
    id: 'employees',
    label: 'Сотрудники',
    icon: PeopleIcon,
    sectionKey: 'employees',
    requiredRoles: ['head', 'director'],
  },
]

export const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  activeItem,
  onMenuClick,
}) => {
  const user = useAuthStore((state) => state.user)

  // Показываем пункт, если есть нужный раздел или подходящая роль
  const visibleMenuItems = menuItems.filter((item) => {
    const hasSectionAccess = item.sectionKey
      ? Boolean(user?.sections?.[item.sectionKey as keyof User['sections']])
      : false

    if (hasSectionAccess) return true

    if (item.requiredRoles) {
      return hasAnyRole(user, item.requiredRoles)
    }

    return true
  })

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo и заголовок */}
      <Box
        sx={{
          p: 0,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 240,
        }}
      >
        <img
          src="/YadroSide.png"
          alt="Yadro"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>

      {/* Меню пункты */}
      <List
        sx={{
          flex: 1,
          overflowY: 'auto',
          pt: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#d1d1d1',
            borderRadius: '3px',
          },
        }}
      >
        {visibleMenuItems.map((item) => {
          const IconComponent = item.icon
          return (
            <ListItem
              key={item.id}
              disablePadding
              sx={{
                my: 0.5,
                mx: 1,
                borderRadius: 1,
                backgroundColor:
                  activeItem === item.id ? '#e8eaf6' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <ListItemButton
                onClick={() => onMenuClick(item.id)}
                sx={{
                  py: 1,
                  px: 1.5,
                  color: activeItem === item.id ? '#667eea' : '#666',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      activeItem === item.id ? '#667eea' : 'inherit',
                  }}
                >
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight:
                      activeItem === item.id ? '600' : '400',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Разделитель */}
      <Divider sx={{ my: 1 }} />

      {/* Информация пользователя и кнопка выхода */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            color: '#666',
            borderColor: '#ddd',
            '&:hover': {
              backgroundColor: '#fff3cd',
              borderColor: '#ffc107',
            },
          }}
        >
          Выйти
        </Button>
      </Box>
    </Drawer>
  )
}
