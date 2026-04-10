import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  TablePagination,
  CircularProgress,
  Stack,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useAuthStore } from '../../entities/auth'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import {
  getEmployees,
  updateEmployeeStatus,
  assignAsHead,
} from '../../entities/employee/api'
import type { Employee, EmployeeRole, EmployeeStatus } from '../../entities/employee/types'
import { ROLE_LABELS, STATUS_LABELS } from '../../entities/employee/types'
import { AddEmployeeModal } from '../../features/employee-dialogs/AddEmployeeModal'
import { EditEmployeeModal } from '../../features/employee-dialogs/EditEmployeeModal'
import { FilterModal } from '../../features/employee-dialogs/FilterModal'
import { TeacherRatesModal } from '../../features/employee-dialogs/TeacherRatesModal'

const EmployeesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useAuthStore()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<EmployeeRole[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<EmployeeStatus[]>([])
  const [selectedSupervisors, setSelectedSupervisors] = useState<number[]>([])

  const debouncedSearch = useDebounce(searchQuery, 400)

  const [openAddModal, setOpenAddModal] = useState(false)
  const [openFilterModal, setOpenFilterModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [contextEmployee, setContextEmployee] = useState<Employee | null>(null)

  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [openRatesModal, setOpenRatesModal] = useState(false)
  const [ratesEmployee, setRatesEmployee] = useState<Employee | null>(null)

  const isDirector = user && hasAnyRole(user, ['director'])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const result = await getEmployees({
        page,
        size,
        q: debouncedSearch || undefined,
        roles: selectedRoles.length ? selectedRoles.join(',') : undefined,
        statuses: selectedStatuses.length ? selectedStatuses.join(',') : undefined,
        supervisorIds: selectedSupervisors.length ? selectedSupervisors.join(',') : undefined,
      })
      setEmployees(result.items)
      setTotal(result.total)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при загрузке', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setPage(0), [debouncedSearch, selectedRoles, selectedStatuses, selectedSupervisors])
  useEffect(() => {
    fetchEmployees()
  }, [page, size, debouncedSearch, selectedRoles, selectedStatuses, selectedSupervisors])

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>, emp: Employee) => {
    setAnchorEl(e.currentTarget)
    setContextEmployee(emp)
  }
  const handleCloseContext = () => {
    setAnchorEl(null)
    setContextEmployee(null)
  }

  const handleToggleStatus = async () => {
    if (!contextEmployee) return handleCloseContext()

    if (contextEmployee.role === 'DIRECTOR') {
      setErrorModal(`Невозможно ${contextEmployee.status === 'ACTIVE' ? 'деактивировать' : 'активировать'} директора`)
      handleCloseContext()
      return
    }
    if (contextEmployee.role === 'HEAD' && !isDirector) {
      setErrorModal(`Вы не можете ${contextEmployee.status === 'ACTIVE' ? 'деактивировать' : 'активировать'} руководителя`)
      handleCloseContext()
      return
    }

    try {
      await updateEmployeeStatus(contextEmployee.userId)
      enqueueSnackbar('Статус обновлен', { variant: 'success' })
      await fetchEmployees()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка', { variant: 'error' })
    } finally {
      handleCloseContext()
    }
  }

  const handleEdit = () => {
    if (!contextEmployee) return handleCloseContext()

    if (contextEmployee.role === 'DIRECTOR') {
      setErrorModal('Невозможно редактировать директора')
      handleCloseContext()
      return
    }
    if (contextEmployee.role === 'HEAD' && !isDirector) {
      setErrorModal('Вы не можете редактировать руководителей')
      handleCloseContext()
      return
    }

    setEditingEmployee(contextEmployee)
    setOpenEditModal(true)
    handleCloseContext()
  }

  const handleAssignHead = async () => {
    if (!contextEmployee) return handleCloseContext()

    if (!isDirector) {
      setErrorModal('Вы не можете назначать руководителей')
      handleCloseContext()
      return
    }

    try {
      await assignAsHead(contextEmployee.userId)
      enqueueSnackbar('Назначен руководителем', { variant: 'success' })
      await fetchEmployees()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка', { variant: 'error' })
    } finally {
      handleCloseContext()
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Сотрудники
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <TextField
          placeholder="Поиск по ФИО, ID, телефону..."
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { height: 48, borderRadius: 2, bgcolor: '#fff' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setOpenFilterModal(true)}
            sx={{ height: 48, borderRadius: 2, px: 3, bgcolor: '#fff' }}
          >
            Фильтр
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{ height: 48, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
          >
            Добавить
          </Button>
        </Stack>
      </Box>

      <Paper
        variant="outlined"
        sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}
      >
        {loading && employees.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <CircularProgress size={48} />
          </Box>
        ) : employees.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Сотрудники не найдены</Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#637381',
                      bgcolor: '#F3F6FB',
                      borderBottom: '1px solid rgba(145,158,171,0.20)',
                      py: 1.5,
                      px: 2,
                    },
                  }}
                >
                  <TableCell width={70}>ID</TableCell>
                  <TableCell>Фамилия и имя</TableCell>
                  <TableCell>Номер телефона</TableCell>
                  <TableCell>Должность</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Руководитель</TableCell>
                  <TableCell width={60} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.userId} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 } }}>
                    <TableCell>{emp.userId}</TableCell>
                    <TableCell>{emp.lastName} {emp.firstName}</TableCell>
                    <TableCell>{emp.phoneNumber ? formatPhoneForUi(emp.phoneNumber) : '—'}</TableCell>
                    <TableCell>{ROLE_LABELS[emp.role] || emp.role}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[emp.status] || emp.status}
                        size="small"
                        sx={{
                          height: 24,
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          ...(emp.status === 'ACTIVE'
                            ? { bgcolor: '#22C55E', color: '#fff' }
                            : { bgcolor: 'rgba(145,158,171,0.18)', color: '#637381' }),
                        }}
                      />
                    </TableCell>
                    <TableCell>{emp.supervisorName || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleContextMenu(e, emp)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={size}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Строк на странице"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`
          }
        />
      </Paper>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContext}>
        <MenuItem onClick={handleToggleStatus}>
          {contextEmployee?.status === 'ACTIVE' ? 'Деактивировать' : 'Активировать'}
        </MenuItem>
        <MenuItem onClick={handleEdit}>Редактировать</MenuItem>
        <MenuItem onClick={handleAssignHead}>Назначить руководителем</MenuItem>
        <MenuItem onClick={() => {
          if (contextEmployee) { setRatesEmployee(contextEmployee); setOpenRatesModal(true) }
          handleCloseContext()
        }}>
          Редактировать ставки
        </MenuItem>
      </Menu>

      <AddEmployeeModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={fetchEmployees}
      />

      <FilterModal
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        onApply={(roles, statuses, supervisors) => {
          setSelectedRoles(roles)
          setSelectedStatuses(statuses)
          setSelectedSupervisors(supervisors)
        }}
        initialRoles={selectedRoles}
        initialStatuses={selectedStatuses}
        initialSupervisors={selectedSupervisors}
      />

      <EditEmployeeModal
        open={openEditModal}
        onClose={() => {
          setOpenEditModal(false)
          setEditingEmployee(null)
        }}
        onSuccess={fetchEmployees}
        employee={editingEmployee}
      />

      <TeacherRatesModal
        open={openRatesModal}
        onClose={() => { setOpenRatesModal(false); setRatesEmployee(null) }}
        employee={ratesEmployee}
      />

      <Dialog open={!!errorModal} onClose={() => setErrorModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>{errorModal}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorModal(null)}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeesPage
