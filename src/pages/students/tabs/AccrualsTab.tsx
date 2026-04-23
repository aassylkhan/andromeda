import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { getStudentAccruals, convertBack } from '../../../entities/student/api'
import type { AccrualItem } from '../../../entities/student/types'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 2,
} as const

const formatDateTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const formatMoney = (val: number) =>
  val.toLocaleString('ru-KZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₸'

interface AccrualsTabProps {
  studentId: number
  refreshKey?: number
  onConvertSuccess: () => void
}

export const AccrualsTab: React.FC<AccrualsTabProps> = ({ studentId, refreshKey, onConvertSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState<AccrualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<AccrualItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getStudentAccruals(studentId))
    } catch {
      enqueueSnackbar('Ошибка загрузки начислений', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [studentId, enqueueSnackbar])

  useEffect(() => { load() }, [load, refreshKey])

  const handleConvertSuccess = () => {
    setSelected(null)
    load()
    onConvertSuccess()
  }

  if (loading && items.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
  }

  if (items.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Начисления отсутствуют</Typography>
  }

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={TH_SX}>Дата и время</TableCell>
              <TableCell sx={TH_SX}>Счёт</TableCell>
              <TableCell sx={TH_SX} align="right">Начислено</TableCell>
              <TableCell sx={TH_SX} align="right">Стоимость</TableCell>
              <TableCell sx={TH_SX} align="right">Ставка</TableCell>
              <TableCell sx={TH_SX} align="right">Остаток</TableCell>
              <TableCell sx={{ ...TH_SX, width: 180 }}>Действие</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(a.createdAt)}</TableCell>
                <TableCell>{a.accountTypeName}</TableCell>
                <TableCell align="right">{a.accrual}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(a.price)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(a.rate)}</TableCell>
                <TableCell align="right">{a.remain}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    disabled={a.remain === 0}
                    onClick={() => setSelected(a)}
                  >
                    Конвертировать
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selected && (
        <ConvertBackDialog
          open
          onClose={() => setSelected(null)}
          studentId={studentId}
          accrual={selected}
          onSuccess={handleConvertSuccess}
        />
      )}
    </>
  )
}

const ConvertBackDialog: React.FC<{
  open: boolean
  onClose: () => void
  studentId: number
  accrual: AccrualItem
  onSuccess: () => void
}> = ({ open, onClose, studentId, accrual, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const numAmount = Number(amount)
  const isValid = amount !== '' && Number.isInteger(numAmount) && numAmount >= 1 && numAmount <= accrual.remain
  const tooLarge = numAmount > accrual.remain
  const refundAmount = isValid ? (numAmount * accrual.rate) : 0

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      await convertBack(studentId, accrual.id, numAmount)
      enqueueSnackbar('Конвертация выполнена', { variant: 'success' })
      onSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ошибка конвертации'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Конвертация</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Счёт: <b>{accrual.accountTypeName}</b> · Остаток: <b>{accrual.remain}</b> · Ставка: <b>{formatMoney(accrual.rate)}</b>
        </Typography>

        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Количество"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={tooLarge}
          helperText={tooLarge ? `Максимум: ${accrual.remain}` : (isValid ? `Возврат на баланс: ${formatMoney(refundAmount)}` : ' ')}
          slotProps={{ htmlInput: { min: 1, max: accrual.remain, step: 1 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? <CircularProgress size={20} /> : 'Конвертировать'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
