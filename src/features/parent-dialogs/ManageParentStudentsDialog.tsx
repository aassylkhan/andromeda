import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Divider,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  InputAdornment,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import {
  getParentStudents,
  addStudentToParent,
  removeStudentFromParent,
} from '../../entities/parent/api'
import type { ParentStudentLink } from '../../entities/parent/types'
import { searchStudentsLookup } from '../../entities/student/api'
import type { StudentLookupItem } from '../../entities/student/types'

interface Props {
  open: boolean
  onClose: () => void
  parentId: number
  parentName: string
}

export function ManageParentStudentsDialog({ open, onClose, parentId, parentName }: Props) {
  const { enqueueSnackbar } = useSnackbar()

  const [links, setLinks] = useState<ParentStudentLink[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const loadLinks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getParentStudents(parentId)
      setLinks(data)
    } catch {
      enqueueSnackbar('Ошибка загрузки учеников', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    if (open) loadLinks()
  }, [open, loadLinks])

  const handleRemove = async (linkId: number) => {
    try {
      await removeStudentFromParent(parentId, linkId)
      enqueueSnackbar('Ученик откреплён', { variant: 'success' })
      await loadLinks()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при удалении'
      enqueueSnackbar(msg, { variant: 'error' })
    }
  }

  const handleAddStudent = async (studentId: number) => {
    try {
      await addStudentToParent(parentId, studentId)
      enqueueSnackbar('Ученик прикреплён', { variant: 'success' })
      setAddOpen(false)
      await loadLinks()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при добавлении'
      enqueueSnackbar(msg, { variant: 'error' })
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Управление учениками — {parentName}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : links.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Нет прикреплённых учеников
            </Typography>
          ) : (
            <List disablePadding>
              {links.map((link) => (
                <ListItem
                  key={link.linkId}
                  divider
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRemove(link.linkId)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={link.fullName}
                    secondary={`ID ученика: ${link.studentId}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          <Button variant="outlined" fullWidth onClick={() => setAddOpen(true)}>
            Добавить ученика
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <AddStudentToParentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddStudent}
      />
    </>
  )
}

function AddStudentToParentDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (studentId: number) => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState<StudentLookupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    if (open) {
      setSearch('')
      setStudents([])
      setSelectedId(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    searchStudentsLookup(debouncedSearch || undefined)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [debouncedSearch, open])

  const handleAdd = async () => {
    if (selectedId == null) return
    setSubmitting(true)
    try {
      await onAdd(selectedId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить ученика</DialogTitle>
      <DialogContent>
        <TextField
          placeholder="Поиск по ФИО, ID, телефону..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mt: 1, mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : students.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
            Ученики не найдены
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#F3F6FB', color: '#637381' } }}>
                  <TableCell width={50} />
                  <TableCell width={70}>ID</TableCell>
                  <TableCell>Фамилия и имя</TableCell>
                  <TableCell>Телефон</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow
                    key={s.studentId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    selected={selectedId === s.studentId}
                    onClick={() => setSelectedId(s.studentId)}
                  >
                    <TableCell>
                      <Radio size="small" checked={selectedId === s.studentId} />
                    </TableCell>
                    <TableCell>{s.studentId}</TableCell>
                    <TableCell>{s.lastName} {s.firstName}</TableCell>
                    <TableCell>{s.phoneNumber ? formatPhoneForUi(s.phoneNumber) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={selectedId == null || submitting}
        >
          {submitting ? <CircularProgress size={20} /> : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
