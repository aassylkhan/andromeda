import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { getSubjects } from '../../entities/lookup/api'
import { getGroupTypes } from '../../entities/schedule/api'
import type { GroupTypeDto } from '../../entities/schedule/types'
import type { LookupDto } from '../../entities/lookup/types'
import type { ScheduleFilter } from '../../pages/schedule/OfflineSchedulePage'

interface Props {
  open: boolean
  filter: ScheduleFilter
  onClose: () => void
  onApply: (filter: ScheduleFilter) => void
  onReset: () => void
}

export function ScheduleFilterDialog({ open, filter, onClose, onApply, onReset }: Props) {
  const [groupTypeIds, setGroupTypeIds] = useState<number[]>(filter.groupTypeIds)
  const [subjectIds, setSubjectIds] = useState<number[]>(filter.subjectIds)
  const [teacherIds, setTeacherIds] = useState<number[]>(filter.teacherIds)
  const [studentsFrom, setStudentsFrom] = useState<string>(filter.studentsFrom?.toString() ?? '')
  const [studentsTo, setStudentsTo] = useState<string>(filter.studentsTo?.toString() ?? '')

  const [groupTypes, setGroupTypes] = useState<GroupTypeDto[]>([])
  const [subjects, setSubjects] = useState<LookupDto[]>([])

  useEffect(() => {
    if (!open) return
    Promise.all([
      getGroupTypes(),
      getSubjects(),
    ]).then(([gt, s]) => {
      setGroupTypes(gt)
      setSubjects(s)
    })
  }, [open])

  useEffect(() => {
    setGroupTypeIds(filter.groupTypeIds)
    setSubjectIds(filter.subjectIds)
    setTeacherIds(filter.teacherIds)
    setStudentsFrom(filter.studentsFrom?.toString() ?? '')
    setStudentsTo(filter.studentsTo?.toString() ?? '')
  }, [filter, open])

  const handleApply = () => {
    onApply({
      groupTypeIds,
      subjectIds,
      teacherIds,
      studentsFrom: studentsFrom ? Number(studentsFrom) : null,
      studentsTo: studentsTo ? Number(studentsTo) : null,
    })
  }

  const handleReset = () => {
    setGroupTypeIds([])
    setSubjectIds([])
    setTeacherIds([])
    setStudentsFrom('')
    setStudentsTo('')
    onReset()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Фильтр расписания</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Тип группы</InputLabel>
          <Select
            multiple
            value={groupTypeIds}
            onChange={(e) => setGroupTypeIds(e.target.value as number[])}
            input={<OutlinedInput label="Тип группы" />}
            renderValue={(selected) =>
              selected
                .map((id) => groupTypes.find((gt) => gt.id === id)?.name ?? id)
                .join(', ')
            }
          >
            {groupTypes.map((gt) => (
              <MenuItem key={gt.id} value={gt.id}>
                <Checkbox checked={groupTypeIds.includes(gt.id)} size="small" />
                <ListItemText primary={gt.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Предмет</InputLabel>
          <Select
            multiple
            value={subjectIds}
            onChange={(e) => setSubjectIds(e.target.value as number[])}
            input={<OutlinedInput label="Предмет" />}
            renderValue={(selected) =>
              selected
                .map((id) => subjects.find((s) => s.id === id)?.name ?? id)
                .join(', ')
            }
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Checkbox checked={subjectIds.includes(s.id)} size="small" />
                <ListItemText primary={s.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Количество учеников
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="От"
              type="number"
              value={studentsFrom}
              onChange={(e) => setStudentsFrom(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              label="До"
              type="number"
              value={studentsTo}
              onChange={(e) => setStudentsTo(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset}>Сбросить</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" onClick={handleApply}>Применить</Button>
      </DialogActions>
    </Dialog>
  )
}
