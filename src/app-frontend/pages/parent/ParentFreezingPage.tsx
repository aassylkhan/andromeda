import React from 'react'
import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const ParentFreezingPage: React.FC = () => (
  <AppEmptyState
    icon={<AcUnitRoundedIcon sx={{ fontSize: 32 }} />}
    title="Заморозка"
    message="Здесь скоро появится возможность управлять заморозками."
  />
)
