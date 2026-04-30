import React from 'react'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const StudentResultsPage: React.FC = () => (
  <AppEmptyState
    icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 32 }} />}
    title="Результаты"
    message="Скоро здесь будут отображаться твои результаты по занятиям."
  />
)
