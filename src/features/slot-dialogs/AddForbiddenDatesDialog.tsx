import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { createForbiddenDatesRange } from '../../entities/forbidden-date/api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddForbiddenDatesDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rangeError, setRangeError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFromDate('')
      setToDate('')
      setRangeError(null)
      setSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (fromDate && toDate && toDate < fromDate) {
      setRangeError('Дата «До» не может быть раньше даты «От»')
    } else {
      setRangeError(null)
    }
  }, [fromDate, toDate])

  const handleSave = async () => {
    if (!fromDate || !toDate) {
      enqueueSnackbar('Укажите обе даты диапазона', { variant: 'warning' })
      return
    }
    if (rangeError) {
      enqueueSnackbar(rangeError, { variant: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      const result = await createForbiddenDatesRange({ fromDate, toDate })
      let message = `Добавлено дат: ${result.createdCount}`
      if (result.skippedCount > 0) {
        message += ` (пропущено уже существующих: ${result.skippedCount})`
      }
      enqueueSnackbar(message, { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при сохранении'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Добавить недоступные даты</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="От"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            fullWidth
            size="small"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="До"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            fullWidth
            size="small"
            required
            error={!!rangeError}
            helperText={rangeError}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Typography variant="caption" color="text.secondary">
            Будут созданы записи на каждый день диапазона включительно. Уже существующие даты будут
            пропущены.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Отменить
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitting || !!rangeError || !fromDate || !toDate}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
