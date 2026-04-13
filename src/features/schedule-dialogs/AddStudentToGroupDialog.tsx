import { useState } from 'react'
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { searchStudentsLookup } from '../../entities/student/api'
import { addStudentToGroup } from '../../entities/schedule/api'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { useEffect } from 'react'

interface StudentOption {
  id: number
  label: string
}

interface Props {
  open: boolean
  groupId: number
  onClose: () => void
  onAdded: () => void
}

export function AddStudentToGroupDialog({ open, groupId, onClose, onAdded }: Props) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<StudentOption[]>([])
  const [selected, setSelected] = useState<StudentOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setOptions([])
      return
    }
    setLoading(true)
    searchStudentsLookup(debouncedQuery)
      .then((students) => {
        setOptions(
          students.map((s) => ({
            id: s.studentId,
            label: `${s.lastName} ${s.firstName} (ID: ${s.studentId}${s.phoneNumber ? ', ' + s.phoneNumber : ''})`,
          }))
        )
      })
      .catch(() => {
        setOptions([])
        setError('Ошибка поиска учеников')
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  const handleAdd = async () => {
    if (!selected) return
    setError(null)
    setSaving(true)
    try {
      await addStudentToGroup(groupId, selected.id)
      onAdded()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка при добавлении ученика')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавление ученика</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>
        )}
        <Autocomplete
          options={options}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={selected}
          onChange={(_, val) => setSelected(val)}
          onInputChange={(_, val) => setQuery(val)}
          loading={loading}
          noOptionsText={query.length < 2 ? 'Введите минимум 2 символа' : 'Ученики не найдены'}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Поиск ученика (ФИО, ID, телефон)"
              size="small"
              fullWidth
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Отменить</Button>
        <Button variant="contained" onClick={handleAdd} disabled={saving || !selected}>
          {saving ? <CircularProgress size={20} /> : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
