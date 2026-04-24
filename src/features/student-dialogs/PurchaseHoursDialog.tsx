import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { StudentDetail, PriceItem } from '../../entities/student/types'
import { getPrices, purchaseHours } from '../../entities/student/api'

const HOUR_TYPE_LABELS: Record<string, string> = {
  offline_group_hour: 'Групповые оффлайн часы',
  offline_individual_hour: 'Индивидуальные оффлайн часы',
  online_individual_hour: 'Индивидуальные онлайн часы',
}

interface PurchaseHoursDialogProps {
  open: boolean
  onClose: () => void
  student: StudentDetail
  onSuccess: () => void
}

export const PurchaseHoursDialog: React.FC<PurchaseHoursDialogProps> = ({ open, onClose, student, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()

  const [prices, setPrices] = useState<PriceItem[]>([])
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [priceId, setPriceId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedPrice = useMemo(
    () => prices.find((p) => p.id === priceId),
    [prices, priceId]
  )

  const totalCost = useMemo(() => {
    if (!selectedPrice || !quantity || quantity <= 0) return 0
    return selectedPrice.price * quantity
  }, [selectedPrice, quantity])

  const formatMoney = (val: number) =>
    val.toLocaleString('ru-KZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' тг'

  useEffect(() => {
    if (!open) return
    setLoadingPrices(true)
    getPrices()
      .then(setPrices)
      .catch(() => enqueueSnackbar('Ошибка загрузки типов часов', { variant: 'error' }))
      .finally(() => setLoadingPrices(false))
  }, [open, enqueueSnackbar])

  useEffect(() => {
    if (!open) {
      setPriceId('')
      setQuantity('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!priceId) {
      enqueueSnackbar('Выберите вид часов', { variant: 'warning' })
      return
    }
    if (!quantity || quantity <= 0) {
      enqueueSnackbar('Укажите количество больше 0', { variant: 'warning' })
      return
    }

    if (totalCost > student.balance) {
      setErrorMessage('У студента не достаточно средств')
      setErrorDialogOpen(true)
      return
    }

    setSubmitting(true)
    try {
      await purchaseHours(student.studentId, priceId as number, quantity)
      enqueueSnackbar('Часы успешно приобретены', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка при покупке часов'
      setErrorMessage(msg)
      setErrorDialogOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Приобретение часов</DialogTitle>
        <DialogContent>
          {loadingPrices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                select
                label="Вид"
                value={priceId}
                onChange={(e) => setPriceId(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {prices.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {HOUR_TYPE_LABELS[p.hourType] ?? p.hourType}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Количество"
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value
                  setQuantity(val === '' ? '' : Math.max(0, Math.floor(Number(val))))
                }}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />

              <TextField
                label="К списанию"
                value={totalCost > 0 ? formatMoney(totalCost) : '—'}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                    color: totalCost > student.balance ? 'error.main' : 'text.primary',
                  },
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Баланс ученика: {formatMoney(student.balance)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Отменить</Button>
          <Button
            variant="contained"
            disabled={submitting || loadingPrices || !priceId || !quantity || quantity <= 0}
            onClick={handleSubmit}
          >
            {submitting ? <CircularProgress size={20} /> : 'Купить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorDialogOpen(false)}>ОК</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
