import React, { useState, useEffect } from 'react'
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
import { getSubjects, createTeacherRate } from '../../entities/employee/api'
import type { SubjectDto } from '../../entities/employee/types'

interface Props {
  open: boolean
  onClose: () => void
  teacherUserId: number
  onSuccess: () => void
}

export const AddTeacherRateModal: React.FC<Props> = ({ open, onClose, teacherUserId, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [rate, setRate] = useState('')
  const [activationDate, setActivationDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [rateError, setRateError] = useState('')
  const [dateError, setDateError] = useState('')
  const [subjectError, setSubjectError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!open) {
      setSubjectId(''); setRate(''); setActivationDate('')
      setRateError(''); setDateError(''); setSubjectError('')
      return
    }
    setSubjectsLoading(true)
    getSubjects(teacherUserId)
      .then(setSubjects)
      .catch(() => enqueueSnackbar('Не удалось загрузить список предметов', { variant: 'error' }))
      .finally(() => setSubjectsLoading(false))
  }, [open, teacherUserId, enqueueSnackbar])

  const validate = (): boolean => {
    let valid = true
    if (!subjectId) { setSubjectError('Выберите предмет'); valid = false } else { setSubjectError('') }

    const numRate = Number(rate)
    if (!rate || isNaN(numRate) || numRate <= 0) {
      setRateError('Ставка должна быть больше нуля'); valid = false
    } else { setRateError('') }

    if (!activationDate) {
      setDateError('Укажите дату'); valid = false
    } else if (activationDate < today) {
      setDateError('Дата не может быть раньше сегодня'); valid = false
    } else { setDateError('') }

    return valid
  }

  const handleSave = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      await createTeacherRate(teacherUserId, {
        subjectId: subjectId as number,
        rate: Number(rate),
        activationDate,
      })
      enqueueSnackbar('Ставка добавлена', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка при сохранении ставки'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Установить новую ставку</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {subjectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : subjects.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Предметы не найдены. Добавьте предметы в справочник.
            </Typography>
          ) : (
            <>
              <TextField
                select label="Предмет" value={subjectId}
                onChange={(e) => { setSubjectId(Number(e.target.value)); setSubjectError('') }}
                fullWidth size="small"
                error={!!subjectError} helperText={subjectError}
              >
                {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>

              <TextField
                label="Ставка (₸)" type="number" value={rate}
                onChange={(e) => { setRate(e.target.value); setRateError('') }}
                fullWidth size="small"
                error={!!rateError} helperText={rateError}
                slotProps={{ htmlInput: { min: 1, step: 'any' } }}
              />

              <TextField
                label="Дата вступления в силу" type="date" value={activationDate}
                onChange={(e) => { setActivationDate(e.target.value); setDateError('') }}
                fullWidth size="small"
                error={!!dateError} helperText={dateError}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button
          variant="contained"
          disabled={submitting || subjectsLoading || subjects.length === 0}
          onClick={handleSave}
        >
          {submitting ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
