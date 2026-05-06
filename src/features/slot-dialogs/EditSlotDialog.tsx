import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { upsertSlot } from '../../entities/slot/api'
import type { SlotUpsertRequest } from '../../entities/slot/types'

export interface EditSlotTarget {
  learningLanguageId: number
  learningLanguageName: string
  productId: number
  productName: string
  officeId: number
  officeName: string
  learningHourOptionId: number
  learningHourOptionName: string
  quota: number
  comment: string | null
}

interface Props {
  open: boolean
  target: EditSlotTarget | null
  onClose: () => void
  onSaved: () => void
}

interface ApiErrorBody {
  message?: string
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: ApiErrorBody } }).response
    const message = response?.data?.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return 'Не удалось сохранить слот. Попробуйте ещё раз.'
}

export function EditSlotDialog({ open, target, onClose, onSaved }: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const [quota, setQuota] = useState<string>('0')
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !target) return
    setQuota(String(target.quota ?? 0))
    setComment(target.comment ?? '')
    setError(null)
    setSubmitting(false)
  }, [open, target])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSave = async () => {
    if (!target) return

    const trimmedQuota = quota.trim()
    if (trimmedQuota === '') {
      setError('Введите квоту')
      return
    }
    const quotaNum = Number(trimmedQuota)
    if (!Number.isFinite(quotaNum) || !Number.isInteger(quotaNum) || quotaNum < 0) {
      setError('Квота должна быть целым числом ≥ 0')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const payload: SlotUpsertRequest = {
        learningLanguageId: target.learningLanguageId,
        productId: target.productId,
        officeId: target.officeId,
        learningHourOptionId: target.learningHourOptionId,
        quota: quotaNum,
        comment: comment.trim() ? comment.trim() : null,
      }
      await upsertSlot(payload)
      enqueueSnackbar('Слот сохранён', { variant: 'success' })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Редактировать</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '8px !important',
        }}
      >
        {target && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: '#F4F6F8',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Филиал
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {target.officeName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.75 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Язык обучения
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {target.learningLanguageName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Продукт
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {target.productName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Время обучения
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {target.learningHourOptionName}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <TextField
          label="Квота"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
          fullWidth
          autoFocus
          disabled={submitting}
        />
        <TextField
          label="Комментарии"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          disabled={submitting}
          placeholder="Например: ограниченный набор, новые учителя и т.д."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Отменить
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
