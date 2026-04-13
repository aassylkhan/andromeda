import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { getOffices, getSubjects } from '../../entities/lookup/api'
import {
  getGroupTypes,
  getClassrooms,
  getTeachersBySubject,
  createGroup,
} from '../../entities/schedule/api'
import type { GroupTypeDto, ClassroomDto } from '../../entities/schedule/types'
import type { LookupDto } from '../../entities/lookup/types'

const DURATIONS = [
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
]

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

interface Props {
  open: boolean
  defaultOfficeId: number
  onClose: () => void
  onCreated: () => void
}

export function CreateGroupDialog({ open, defaultOfficeId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [groupTypeId, setGroupTypeId] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [teacherId, setTeacherId] = useState<number | ''>('')
  const [officeId, setOfficeId] = useState<number>(defaultOfficeId)
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    Promise.all([
      getGroupTypes('offline'),
      getSubjects(),
      getOffices(),
    ]).then(([gt, s, o]) => {
      setGroupTypes(gt)
      setSubjects(s)
      setOffices(o)
    }).catch(() => {
      setError('Ошибка загрузки справочников')
    })
  }, [open])

  useEffect(() => {
    if (subjectId === '') {
      setTeachers([])
      setTeacherId('')
      return
    }
    getTeachersBySubject(Number(subjectId)).then(setTeachers).catch(() => setError('Ошибка загрузки преподавателей'))
    setTeacherId('')
  }, [subjectId])

  useEffect(() => {
    if (!officeId) {
      setClassrooms([])
      setClassroomId('')
      return
    }
    getClassrooms(officeId).then(setClassrooms).catch(() => setError('Ошибка загрузки кабинетов'))
    setClassroomId('')
  }, [officeId])

  const handleDayToggle = (key: string) => {
    setDays((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim()) { setError('Введите название группы'); return }
    if (groupTypeId === '') { setError('Выберите тип группы'); return }
    if (subjectId === '') { setError('Выберите предмет'); return }
    if (teacherId === '') { setError('Выберите преподавателя'); return }
    if (classroomId === '') { setError('Выберите кабинет'); return }
    if (!DAY_KEYS.some((k) => days[k])) { setError('Выберите хотя бы один день'); return }

    setSaving(true)
    try {
      await createGroup({
        name: name.trim(),
        groupTypeId: Number(groupTypeId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        officeId,
        classroomId: Number(classroomId),
        startTime,
        durationMinutes,
        mon: days.mon, tue: days.tue, wed: days.wed,
        thu: days.thu, fri: days.fri, sat: days.sat, sun: days.sun,
      })
      onCreated()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка при создании группы')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Создать группу</DialogTitle>
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
          <Select value={subjectId} label="Предмет" onChange={(e) => setSubjectId(Number(e.target.value))}>
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
          <Select value={officeId} label="Филиал" onChange={(e) => setOfficeId(Number(e.target.value))}>
            {offices.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth disabled={!officeId}>
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Отменить</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
