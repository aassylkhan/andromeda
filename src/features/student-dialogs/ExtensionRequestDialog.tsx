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
import type { StudentDetail, StudentParentLink } from '../../entities/student/types'
import { getStudentParents } from '../../entities/student/api'
import { getProductsDetail } from '../../entities/lookup/api'
import type { ProductDetailDto } from '../../entities/lookup/types'
import { createExtensionRequest } from '../../entities/extension-request/api'

interface ExtensionRequestDialogProps {
  open: boolean
  onClose: () => void
  student: StudentDetail
  onSuccess: () => void
}

export const ExtensionRequestDialog: React.FC<ExtensionRequestDialogProps> = ({
  open,
  onClose,
  student,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [parents, setParents] = useState<StudentParentLink[]>([])
  const [products, setProducts] = useState<ProductDetailDto[]>([])
  const [loadingLookups, setLoadingLookups] = useState(false)

  const [parentId, setParentId] = useState<number | ''>('')
  const [classdays, setClassdays] = useState<number | ''>('')
  const [freezings, setFreezings] = useState<number | ''>('')
  const [fee, setFee] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  // The product is captured at the moment the dialog opens (memorised по ТЗ).
  const memoizedProductId = useMemo(() => student.productId, [student.productId])

  const product = useMemo(
    () => products.find((p) => p.id === memoizedProductId),
    [products, memoizedProductId]
  )

  const months = useMemo(() => {
    const cd = typeof classdays === 'number' ? classdays : 0
    const denom = product?.amountOfClassdaysIn1m
    if (!denom || denom <= 0 || cd <= 0) return 0
    return Math.round((cd / denom) * 100) / 100
  }, [classdays, product])

  const hours = useMemo(() => {
    const cd = typeof classdays === 'number' ? classdays : 0
    const factor = product?.amountOfHoursIn1cd
    if (!factor || factor <= 0 || cd <= 0) return 0
    return cd * factor
  }, [classdays, product])

  useEffect(() => {
    if (!open) return
    setLoadingLookups(true)
    Promise.all([getStudentParents(student.studentId), getProductsDetail()])
      .then(([par, prod]) => {
        setParents(par)
        setProducts(prod)
      })
      .catch(() => enqueueSnackbar('Ошибка загрузки данных', { variant: 'error' }))
      .finally(() => setLoadingLookups(false))
  }, [open, student.studentId, enqueueSnackbar])

  useEffect(() => {
    if (!open) {
      setParentId('')
      setClassdays('')
      setFreezings('')
      setFee('')
      setSubmitting(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (memoizedProductId == null) {
      enqueueSnackbar(
        'У ученика не назначен продукт обучения, расчёт пролонгации невозможен',
        { variant: 'error' }
      )
      return
    }
    if (!parentId) {
      enqueueSnackbar('Выберите родителя', { variant: 'warning' })
      return
    }
    if (!classdays || (typeof classdays === 'number' && classdays <= 0)) {
      enqueueSnackbar('Введите количество учебных дней (> 0)', { variant: 'warning' })
      return
    }
    if (typeof freezings !== 'number' || freezings < 0) {
      enqueueSnackbar('Введите корректное количество заморозок', { variant: 'warning' })
      return
    }
    if (typeof fee !== 'number' || fee < 0) {
      enqueueSnackbar('Введите корректную сумму оплаты', { variant: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      await createExtensionRequest(student.studentId, {
        parentId: parentId as number,
        classdays: classdays as number,
        freezings: freezings as number,
        fee: fee as number,
      })
      enqueueSnackbar('Запрос успешно отправлен', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при создании запроса'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const numberFromInput = (val: string): number | '' => {
    if (val === '') return ''
    const n = Number(val)
    return Number.isFinite(n) ? n : ''
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Пролонгация групповых оффлайн часов</DialogTitle>
      <DialogContent>
        {loadingLookups ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {memoizedProductId == null && (
              <Typography variant="body2" color="error">
                У ученика не назначен продукт обучения. Запрос можно отправить только после
                записи на обучение.
              </Typography>
            )}

            <TextField
              select
              label="Родитель"
              value={parentId}
              onChange={(e) => setParentId(Number(e.target.value))}
              fullWidth
              size="small"
              disabled={memoizedProductId == null}
            >
              {parents.length === 0 && (
                <MenuItem value="" disabled>
                  Нет привязанных родителей
                </MenuItem>
              )}
              {parents.map((p) => (
                <MenuItem key={p.parentId} value={p.parentId}>
                  {p.fullName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Количество учебных дней"
              type="number"
              value={classdays}
              onChange={(e) => {
                const val = numberFromInput(e.target.value)
                if (val === '' || (typeof val === 'number' && val >= 0)) {
                  setClassdays(val === '' ? '' : Math.floor(val))
                }
              }}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              disabled={memoizedProductId == null}
            />

            <TextField
              label="Количество месяцев"
              value={months > 0 ? months.toString() : '—'}
              fullWidth
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label="Количество учебных часов"
              value={hours > 0 ? hours.toString() : '—'}
              fullWidth
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label="Надбавка к заморозкам"
              type="number"
              value={freezings}
              onChange={(e) => {
                const val = numberFromInput(e.target.value)
                if (val === '' || (typeof val === 'number' && val >= 0)) {
                  setFreezings(val === '' ? '' : Math.floor(val))
                }
              }}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              disabled={memoizedProductId == null}
            />

            <TextField
              label="Оплата"
              type="number"
              value={fee}
              onChange={(e) => {
                const val = numberFromInput(e.target.value)
                if (val === '' || (typeof val === 'number' && val >= 0)) {
                  setFee(val)
                }
              }}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              disabled={memoizedProductId == null}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Отменить
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting ||
            loadingLookups ||
            memoizedProductId == null ||
            !parentId ||
            !classdays ||
            typeof freezings !== 'number' ||
            typeof fee !== 'number'
          }
        >
          {submitting ? <CircularProgress size={20} /> : 'Отправить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
