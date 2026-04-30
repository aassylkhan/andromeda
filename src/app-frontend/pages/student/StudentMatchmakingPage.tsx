import React from 'react'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import { AppEmptyState } from '../../components/AppEmptyState'

export const StudentMatchmakingPage: React.FC = () => (
  <AppEmptyState
    icon={<EmojiEventsRoundedIcon sx={{ fontSize: 32 }} />}
    title="Матчмейкинг"
    message="Скоро здесь появятся подобранные для тебя соперники и турниры."
  />
)
