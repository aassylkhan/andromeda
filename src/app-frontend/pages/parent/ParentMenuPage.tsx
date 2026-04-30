import React from 'react'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const ParentMenuPage: React.FC = () => (
  <AppEmptyState
    icon={<MenuRoundedIcon sx={{ fontSize: 32 }} />}
    title="Меню"
    message="Этот раздел скоро будет наполнен."
  />
)
