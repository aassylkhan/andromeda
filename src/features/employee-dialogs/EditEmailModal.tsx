import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { isValidGmail } from '../../shared/utils/validationUtils'
import { ConflictModal } from './ConflictModal'
import type { EmployeeCreateResultDto } from '../../entities/employee/types'

interface EditEmailModalProps {
  open: boolean
  onClose: () => void
  onSave: (email: string) => Promise<void>
  currentEmail?: string
}

export const EditEmailModal: React.FC<EditEmailModalProps> = ({ open, onClose, onSave, currentEmail = '' }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [email, setEmail] = useState(currentEmail)
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<{
    conflictUser: EmployeeCreateResultDto['conflictUser']
  } | null>(null)

  const handleSave = async () => {
    if (!isValidGmail(email)) {
      enqueueSnackbar('Email должен быть @gmail.com', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      await onSave(email)
      onClose()
    } catch (error: any) {
      if (error?.response?.status === 409) {
        const conflictData = error.response.data as any
        if (conflictData?.conflictUser) {
          setConflict({ conflictUser: conflictData.conflictUser })
        }
      } else {
        enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при сохранении', { variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open && !conflict} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Редактировать email</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Gmail"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Отменить
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ position: 'relative' }}>
            {loading && <CircularProgress size={20} sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />}
            <span style={{ visibility: loading ? 'hidden' : 'visible' }}>Сохранить</span>
          </Button>
        </DialogActions>
      </Dialog>

      <ConflictModal
        open={!!conflict}
        conflictType="EDIT_EMAIL_CONFLICT"
        conflictUser={conflict?.conflictUser}
        onClose={() => setConflict(null)}
        confirmLabel="Закрыть"
        loading={false}
      />
    </>
  )
}
