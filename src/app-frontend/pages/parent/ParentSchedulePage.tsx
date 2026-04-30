import React from 'react'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const ParentSchedulePage: React.FC = () => (
  <AppEmptyState
    icon={<CalendarMonthRoundedIcon sx={{ fontSize: 32 }} />}
    title="Расписание"
    message="Здесь скоро появится расписание занятий вашего ребёнка."
  />
)
