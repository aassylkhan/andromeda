import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { getStudentParents, addParentToStudent, removeParentFromStudent } from '../../../entities/student/api'
import type { StudentParentLink } from '../../../entities/student/types'
import { getParents } from '../../../entities/parent/api'
import type { ParentListItem } from '../../../entities/parent/types'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../../shared/utils/phoneUtils'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 2,
} as const

interface ParentsTabProps {
  studentId: number
}

export const ParentsTab: React.FC<ParentsTabProps> = ({ studentId }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [parents, setParents] = useState<StudentParentLink[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const loadParents = useCallback(async () => {
    setLoading(true)
    try {
      setParents(await getStudentParents(studentId))
    } catch {
      enqueueSnackbar('Ошибка загрузки родителей', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [studentId, enqueueSnackbar])

  useEffect(() => { loadParents() }, [loadParents])

  const handleDelete = async (linkId: number) => {
    try {
      await removeParentFromStudent(studentId, linkId)
      enqueueSnackbar('Связь удалена', { variant: 'success' })
      loadParents()
    } catch {
      enqueueSnackbar('Ошибка удаления', { variant: 'error' })
    }
  }

  if (loading && parents.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
  }

  return (
    <Box>
      {parents.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Родители не найдены</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={TH_SX}>ФИО</TableCell>
                <TableCell sx={TH_SX}>ID</TableCell>
                <TableCell sx={TH_SX}>Номер телефона</TableCell>
                <TableCell sx={TH_SX}>Номер документа</TableCell>
                <TableCell sx={{ ...TH_SX, width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {parents.map((p) => (
                <TableRow key={p.linkId} hover>
                  <TableCell>{p.fullName}</TableCell>
                  <TableCell>{p.userId}</TableCell>
                  <TableCell>{p.phoneNumber ? formatPhoneForUi(p.phoneNumber) : '—'}</TableCell>
                  <TableCell>{p.documentNumber ?? '—'}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => handleDelete(p.linkId)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Добавить родителя
        </Button>
      </Box>

      <AddParentToStudentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        studentId={studentId}
        onSuccess={() => { setAddOpen(false); loadParents() }}
      />
    </Box>
  )
}

const AddParentToStudentDialog: React.FC<{
  open: boolean
  onClose: () => void
  studentId: number
  onSuccess: () => void
}> = ({ open, onClose, studentId, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ParentListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<ParentListItem | null>(null)
  const [adding, setAdding] = useState(false)

  const debouncedQ = useDebounce(searchQuery, 400)

  useEffect(() => {
    if (!open) { setSearchQuery(''); setResults([]); setSelected(null); return }
    if (!debouncedQ) { setResults([]); return }
    setSearching(true)
    getParents({ q: debouncedQ, size: 20 })
      .then((res) => setResults(res.items))
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [debouncedQ, open])

  const handleAdd = async () => {
    if (!selected) return
    setAdding(true)
    try {
      await addParentToStudent(studentId, selected.parentId)
      enqueueSnackbar('Родитель добавлен', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка добавления'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить родителя</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth size="small" placeholder="Поиск по ФИО, ID, телефону..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
        {searching && <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>}
        {!searching && results.length > 0 && (
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={TH_SX}>ФИО</TableCell>
                  <TableCell sx={TH_SX}>ID</TableCell>
                  <TableCell sx={TH_SX}>Телефон</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r) => (
                  <TableRow
                    key={r.parentId}
                    hover
                    selected={selected?.parentId === r.parentId}
                    onClick={() => setSelected(r)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{r.lastName} {r.firstName}</TableCell>
                    <TableCell>{r.userId}</TableCell>
                    <TableCell>{r.phoneNumber ? formatPhoneForUi(r.phoneNumber) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!searching && debouncedQ && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Не найдено</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" disabled={!selected || adding} onClick={handleAdd}>
          {adding ? <CircularProgress size={20} /> : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
