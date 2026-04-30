import React from 'react'
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import type { AppChild } from '../api/appAuthApi'

interface SwitchChildDialogProps {
  open: boolean
  onClose: () => void
  loading: boolean
  children: AppChild[]
  selectedStudentId: number | null
  onSelect: (studentId: number) => void
}

export const SwitchChildDialog: React.FC<SwitchChildDialogProps> = ({
  open,
  onClose,
  loading,
  children: kids,
  selectedStudentId,
  onSelect,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Выберите ученика
        <IconButton onClick={onClose} size="small" aria-label="закрыть">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : kids.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              К вашему аккаунту пока не привязаны дети.
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {kids.map((kid) => {
              const isSelected = selectedStudentId === kid.studentId
              return (
                <ListItem key={kid.studentId} disablePadding>
                  <ListItemButton
                    onClick={() => onSelect(kid.studentId)}
                    sx={{
                      px: 3,
                      py: 1.5,
                      bgcolor: isSelected ? 'rgba(24,119,242,0.08)' : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={kid.fullName}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    {isSelected && (
                      <CheckCircleOutlineRoundedIcon
                        sx={{ color: '#1877F2', ml: 1, flexShrink: 0 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
