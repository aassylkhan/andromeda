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
  InputAdornment,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { normalizePhoneDigits } from '../../shared/utils/phoneUtils'
import { ConflictModal } from './ConflictModal'
import type { EmployeeCreateResultDto } from '../../entities/employee/types'

interface EditPhoneModalProps {
  open: boolean
  onClose: () => void
  onSave: (phone: string) => Promise<void>
  onTakePhone?: (sourceUserId: number, phone: string) => Promise<void>
  currentPhone?: string
}

export const EditPhoneModal: React.FC<EditPhoneModalProps> = ({
  open,
  onClose,
  onSave,
  onTakePhone,
  currentPhone = '',
}) => {
  const { enqueueSnackbar } = useSnackbar()
  const [phone, setPhone] = useState(currentPhone)
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<{
    conflictUser: EmployeeCreateResultDto['conflictUser']
  } | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  const handleSave = async () => {
    if (!phone || normalizePhoneDigits(phone).length < 10) {
      enqueueSnackbar('Некорректный номер телефона', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      await onSave(phone)
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

  const handleTakePhone = async () => {
    if (!conflict?.conflictUser || !onTakePhone) return

    setConflictLoading(true)
    try {
      await onTakePhone(conflict.conflictUser.id, phone)
      enqueueSnackbar('Номер перенесен', { variant: 'success' })
      setConflict(null)
      onClose()
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при переносе номера', { variant: 'error' })
    } finally {
      setConflictLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open && !conflict} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Редактировать номер телефона</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="WhatsApp номер"
              placeholder="700 123 45 67"
              fullWidth
              value={phone.replace(/^\+/, '')}
              onChange={(e) => setPhone(e.target.value)}
              inputProps={{ inputMode: 'tel' }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    +
                  </InputAdornment>
                ),
              }}
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
        conflictType="EDIT_PHONE_CONFLICT"
        conflictUser={conflict?.conflictUser}
        onClose={() => setConflict(null)}
        onConfirm={onTakePhone ? handleTakePhone : undefined}
        confirmLabel="Отобрать номер"
        loading={conflictLoading}
      />
    </>
  )
}
