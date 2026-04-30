import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

interface LogoutConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Выход</DialogTitle>
    <DialogContent>
      <Typography variant="body2">Вы уверены, что хотите выйти из аккаунта?</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={loading}>
        Отмена
      </Button>
      <Button variant="contained" onClick={onConfirm} disabled={loading}>
        Выйти
      </Button>
    </DialogActions>
  </Dialog>
)
