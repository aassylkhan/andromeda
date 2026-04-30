import React from 'react'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const ParentPerformancePage: React.FC = () => (
  <AppEmptyState
    icon={<SchoolRoundedIcon sx={{ fontSize: 32 }} />}
    title="Успеваемость"
    message="Здесь скоро появится подробная информация об успеваемости вашего ребёнка."
  />
)
