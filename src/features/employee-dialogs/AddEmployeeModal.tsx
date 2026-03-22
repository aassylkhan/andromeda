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
  Box,
  CircularProgress,
  InputAdornment,
  Typography,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { getUsers } from '../../entities/user/api'
import type { UserDto } from '../../entities/user/types'
import { createEmployeeFromUser, getSupervisors, EmployeeAlreadyExistsError } from '../../entities/employee/api'
import type { Employee } from '../../entities/employee/types'
import { ASSIGNABLE_ROLES } from '../../entities/employee/types'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'select_user' | 'assign_role'

export function AddEmployeeModal({ open, onClose, onSuccess }: AddEmployeeModalProps) {
  const { enqueueSnackbar } = useSnackbar()

  const [step, setStep] = useState<Step>('select_user')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [users, setUsers] = useState<UserDto[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)

  const [role, setRole] = useState('ACCOUNTANT')
  const [supervisorId, setSupervisorId] = useState<number | ''>('')
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  const [supervisorsLoading, setSupervisorsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [errorModal, setErrorModal] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep('select_user')
      setSearch('')
      setSelectedUser(null)
      setRole('ACCOUNTANT')
      setSupervisorId('')
    }
  }, [open])

  useEffect(() => {
    if (open && step === 'select_user') {
      const fetchUsers = async () => {
        setUsersLoading(true)
        try {
          const result = await getUsers({ q: debouncedSearch || undefined, size: 50 })
          setUsers(result.items)
        } catch {
          setUsers([])
        } finally {
          setUsersLoading(false)
        }
      }
      fetchUsers()
    }
  }, [open, step, debouncedSearch])

  useEffect(() => {
    if (open && step === 'assign_role') {
      const fetchSupervisors = async () => {
        setSupervisorsLoading(true)
        try {
          const data = await getSupervisors()
          setSupervisors(data)
        } catch {
          setSupervisors([])
        } finally {
          setSupervisorsLoading(false)
        }
      }
      fetchSupervisors()
    }
  }, [open, step])

  const handleNext = () => {
    if (!selectedUser) return
    setStep('assign_role')
  }

  const handleBack = () => {
    setStep('select_user')
    setRole('ACCOUNTANT')
    setSupervisorId('')
  }

  const handleSubmit = async () => {
    if (!selectedUser || !supervisorId) return

    setSubmitting(true)
    try {
      await createEmployeeFromUser({
        userId: selectedUser.id,
        role,
        supervisorId: supervisorId as number,
      })
      enqueueSnackbar('Сотрудник добавлен', { variant: 'success' })
      onClose()
      onSuccess()
    } catch (error) {
      if (error instanceof EmployeeAlreadyExistsError) {
        setErrorModal('Данный пользователь уже добавлен как сотрудник')
      } else {
        enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка', { variant: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (errorModal) {
    return (
      <Dialog open onClose={() => { setErrorModal(null); onClose() }} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>{errorModal}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { setErrorModal(null); onClose() }}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  if (step === 'select_user') {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить сотрудника — Шаг 1: Выбор пользователя</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              placeholder="Поиск по ФИО, ID, телефону..."
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#F3F6FB', color: '#637381' } }}>
                      <TableCell width={50} />
                      <TableCell width={60}>ID</TableCell>
                      <TableCell>Фамилия и имя</TableCell>
                      <TableCell>Телефон</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Пользователи не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow
                          key={u.id}
                          hover
                          selected={selectedUser?.id === u.id}
                          onClick={() => setSelectedUser(u)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Radio checked={selectedUser?.id === u.id} size="small" />
                          </TableCell>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.lastName} {u.firstName}</TableCell>
                          <TableCell>{u.phoneNumber ? formatPhoneForUi(u.phoneNumber) : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отменить</Button>
          <Button variant="contained" onClick={handleNext} disabled={!selectedUser}>
            Далее
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить сотрудника — Шаг 2: Назначение</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {selectedUser && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedUser.lastName} {selectedUser.firstName} (ID: {selectedUser.id})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.phoneNumber ? formatPhoneForUi(selectedUser.phoneNumber) : '—'}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth>
            <FormLabel>Должность</FormLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value)} sx={{ mt: 1 }}>
              {ASSIGNABLE_ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Руководитель</FormLabel>
            {supervisorsLoading ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value as number)}
                displayEmpty
                sx={{ mt: 1 }}
              >
                <MenuItem value="" disabled>Выберите руководителя</MenuItem>
                {supervisors.map((s) => (
                  <MenuItem key={s.userId} value={s.userId}>
                    {s.lastName} {s.firstName} ({s.role})
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleBack}>Назад</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || !supervisorId}>
          {submitting ? <CircularProgress size={20} /> : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
