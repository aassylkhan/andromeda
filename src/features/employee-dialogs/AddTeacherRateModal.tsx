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
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [rate, setRate] = useState<number | ''>('')
  const [activationDate, setActivationDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!open) { setSubjectId(''); setRate(''); setActivationDate(''); return }
    getSubjects(teacherUserId).then(setSubjects).catch(() => {})
  }, [open, teacherUserId])

  const handleSave = async () => {
    if (!subjectId || rate === '' || !activationDate) {
      enqueueSnackbar('Заполните все поля', { variant: 'warning' })
      return
    }
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
        ?? 'Ошибка'
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
          <TextField
            select label="Предмет" value={subjectId}
            onChange={(e) => setSubjectId(Number(e.target.value))}
            fullWidth size="small"
          >
            {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>

          <TextField
            label="Ставка" type="number" value={rate}
            onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth size="small"
          />

          <TextField
            label="Дата вступления в силу" type="date" value={activationDate}
            onChange={(e) => setActivationDate(e.target.value)}
            fullWidth size="small"
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" disabled={submitting} onClick={handleSave}>
          {submitting ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
