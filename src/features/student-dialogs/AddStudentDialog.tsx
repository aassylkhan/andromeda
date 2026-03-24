import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  CircularProgress,
  Box,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { getUsers } from '../../entities/user/api'
import type { UserDto } from '../../entities/user/types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (userId: number) => Promise<void>
}

export function AddStudentDialog({ open, onClose, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    if (open) {
      setSearch('')
      setUsers([])
      setSelectedId(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const result = await getUsers({ q: debouncedSearch || undefined, page: 0, size: 20 })
        setUsers(result.items)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [debouncedSearch, open])

  const handleAdd = async () => {
    if (selectedId == null) return
    setSubmitting(true)
    try {
      await onAdd(selectedId)
      onClose()
    } catch {
      // parent handles error display
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
        ) : users.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
            Пользователи не найдены
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
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    selected={selectedId === u.id}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <TableCell>
                      <Radio size="small" checked={selectedId === u.id} />
                    </TableCell>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.lastName} {u.firstName}</TableCell>
                    <TableCell>{u.phoneNumber ? formatPhoneForUi(u.phoneNumber) : '—'}</TableCell>
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
