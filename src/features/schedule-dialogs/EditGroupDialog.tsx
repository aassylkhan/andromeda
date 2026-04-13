import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { getOffices, getSubjects } from '../../entities/lookup/api'
import {
  getGroupTypes,
  getClassrooms,
  getTeachersBySubject,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  removeStudentFromGroup,
} from '../../entities/schedule/api'
import type { GroupTypeDto, ClassroomDto, GroupDetailDto } from '../../entities/schedule/types'
import type { LookupDto } from '../../entities/lookup/types'
import { AddStudentToGroupDialog } from './AddStudentToGroupDialog'

const DURATIONS = [
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
]

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function computeDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

interface Props {
  open: boolean
  groupId: number
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export function EditGroupDialog({ open, groupId, onClose, onUpdated, onDeleted }: Props) {
  const [detail, setDetail] = useState<GroupDetailDto | null>(null)
  const [name, setName] = useState('')
  const [groupTypeId, setGroupTypeId] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [teacherId, setTeacherId] = useState<number | ''>('')
  const [officeId, setOfficeId] = useState<number | ''>('')
  const [classroomId, setClassroomId] = useState<number | ''>('')
  const [startTime, setStartTime] = useState('09:00')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [days, setDays] = useState<Record<string, boolean>>({
    mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false,
  })

  const [groupTypes, setGroupTypes] = useState<GroupTypeDto[]>([])
  const [subjects, setSubjects] = useState<LookupDto[]>([])
  const [teachers, setTeachers] = useState<LookupDto[]>([])
  const [offices, setOffices] = useState<LookupDto[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomDto[]>([])

  const [loadingDetail, setLoadingDetail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const [d, gt, s, o] = await Promise.all([
        getGroupDetail(groupId),
        getGroupTypes('offline'),
        getSubjects(),
        getOffices(),
      ])
      setDetail(d)
      setGroupTypes(gt)
      setSubjects(s)
      setOffices(o)

      setName(d.name)
      setGroupTypeId(d.groupTypeId)
      setSubjectId(d.subjectId)
      setOfficeId(d.officeId)
      setStartTime(d.startTime.substring(0, 5))
      setDurationMinutes(computeDuration(d.startTime, d.endTime))
      setDays({
        mon: d.mon, tue: d.tue, wed: d.wed,
        thu: d.thu, fri: d.fri, sat: d.sat, sun: d.sun,
      })

      const [teachersList, classroomsList] = await Promise.all([
        getTeachersBySubject(d.subjectId),
        getClassrooms(d.officeId),
      ])
      setTeachers(teachersList)
      setClassrooms(classroomsList)
      setTeacherId(d.teacherId)
      setClassroomId(d.classroomId)
    } finally {
      setLoadingDetail(false)
    }
  }, [groupId])

  useEffect(() => {
    if (open) loadDetail()
  }, [open, loadDetail])

  const handleSubjectChange = async (newSubjectId: number) => {
    setSubjectId(newSubjectId)
    setTeacherId('')
    const t = await getTeachersBySubject(newSubjectId)
    setTeachers(t)
  }

  const handleOfficeChange = async (newOfficeId: number) => {
    setOfficeId(newOfficeId)
    setClassroomId('')
    const c = await getClassrooms(newOfficeId)
    setClassrooms(c)
  }

  const handleDayToggle = (key: string) => {
    setDays((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) { setError('Введите название группы'); return }
    if (groupTypeId === '') { setError('Выберите тип группы'); return }
    if (subjectId === '') { setError('Выберите предмет'); return }
    if (teacherId === '') { setError('Выберите преподавателя'); return }
    if (officeId === '') { setError('Выберите филиал'); return }
    if (classroomId === '') { setError('Выберите кабинет'); return }
    if (!DAY_KEYS.some((k) => days[k])) { setError('Выберите хотя бы один день'); return }

    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: name.trim(),
        groupTypeId: Number(groupTypeId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        officeId: Number(officeId),
        classroomId: Number(classroomId),
        startTime,
        durationMinutes,
        mon: days.mon, tue: days.tue, wed: days.wed,
        thu: days.thu, fri: days.fri, sat: days.sat, sun: days.sun,
      })
      onUpdated()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteGroup(groupId)
      setConfirmDeleteOpen(false)
      onDeleted()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка при удалении')
      setConfirmDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveStudent = async (studentId: number) => {
    try {
      await removeStudentFromGroup(groupId, studentId)
      await loadDetail()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка при удалении ученика')
    }
  }

  const handleStudentAdded = async () => {
    setAddStudentOpen(false)
    await loadDetail()
  }

  if (loadingDetail) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать группу</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {error && (
            <Typography color="error" variant="body2">{error}</Typography>
          )}

          <TextField
            label="Название группы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Тип группы</InputLabel>
            <Select value={groupTypeId} label="Тип группы" onChange={(e) => setGroupTypeId(Number(e.target.value))}>
              {groupTypes.map((gt) => (
                <MenuItem key={gt.id} value={gt.id}>{gt.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Предмет</InputLabel>
            <Select value={subjectId} label="Предмет" onChange={(e) => handleSubjectChange(Number(e.target.value))}>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth disabled={subjectId === ''}>
            <InputLabel>Преподаватель</InputLabel>
            <Select value={teacherId} label="Преподаватель" onChange={(e) => setTeacherId(Number(e.target.value))}>
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Филиал</InputLabel>
            <Select value={officeId} label="Филиал" onChange={(e) => handleOfficeChange(Number(e.target.value))}>
              {offices.map((o) => (
                <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth disabled={officeId === ''}>
            <InputLabel>Кабинет</InputLabel>
            <Select value={classroomId} label="Кабинет" onChange={(e) => setClassroomId(Number(e.target.value))}>
              {classrooms.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Время начала урока"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Длительность урока</InputLabel>
            <Select value={durationMinutes} label="Длительность урока" onChange={(e) => setDurationMinutes(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Дни проведения
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {DAY_KEYS.map((key, idx) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      size="small"
                      checked={days[key]}
                      onChange={() => handleDayToggle(key)}
                    />
                  }
                  label={DAY_LABELS[idx]}
                  sx={{ mr: 1 }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Students section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Ученики ({detail?.members.length ?? 0})
            </Typography>
            {detail?.members.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет учеников в группе
              </Typography>
            ) : (
              <List dense disablePadding>
                {detail?.members.map((m) => (
                  <ListItem
                    key={m.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveStudent(m.studentId)}
                        color="error"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ px: 0 }}
                  >
                    <ListItemText
                      primary={m.studentName}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => setAddStudentOpen(true)}
            >
              Добавить ученика
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={saving || deleting}
          >
            Удалить
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={saving}>Отменить</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Сохранить'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Удалить группу?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Будут удалены все ученики из группы и сама группа. Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add student dialog */}
      {addStudentOpen && (
        <AddStudentToGroupDialog
          open={addStudentOpen}
          groupId={groupId}
          onClose={() => setAddStudentOpen(false)}
          onAdded={handleStudentAdded}
        />
      )}
    </>
  )
}
