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
} from '@mui/material'
import { useSnackbar } from 'notistack'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { useAuthStore } from '../../entities/auth'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import {
  getEmployees,
  updateEmployeeRole,
  updateEmployeePhone,
  takePhoneFrom,
  updateEmployeeEmail,
  updateEmployeeStatus,
  assignAsHead,
} from '../../entities/employee/api'
import { AddEmployeeModal } from '../../features/employee-dialogs/AddEmployeeModal'
import { FilterModal } from '../../features/employee-dialogs/FilterModal'
import { EditRoleModal } from '../../features/employee-dialogs/EditRoleModal'
import { EditPhoneModal } from '../../features/employee-dialogs/EditPhoneModal'
import { EditEmailModal } from '../../features/employee-dialogs/EditEmailModal'
import type { Employee, EmployeeRole, EmployeeStatus } from '../../entities/employee/types'

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

  const debouncedSearch = useDebounce(searchQuery, 400)

  const [openAddModal, setOpenAddModal] = useState(false)
  const [openFilterModal, setOpenFilterModal] = useState(false)
  const [openEditRoleModal, setOpenEditRoleModal] = useState(false)
  const [openEditPhoneModal, setOpenEditPhoneModal] = useState(false)
  const [openEditEmailModal, setOpenEditEmailModal] = useState(false)

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [contextEmployee, setContextEmployee] = useState<Employee | null>(null)

  const isHeadOrDirector = user && hasAnyRole(user, ['head', 'director'])
  const isDirector = user && hasAnyRole(user, ['director'])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const params: any = { page, size }
      if (debouncedSearch) params.q = debouncedSearch
      if (selectedRoles.length) params.roles = selectedRoles.join(',')
      if (selectedStatuses.length) params.statuses = selectedStatuses.join(',')

      const result = await getEmployees(params)
      const sorted = result.items.sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
      )
      setEmployees(sorted)
      setTotal(result.total)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при загрузке', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setPage(0), [debouncedSearch, selectedRoles, selectedStatuses])
  useEffect(() => {
    fetchEmployees()
  }, [page, size, debouncedSearch, selectedRoles, selectedStatuses])

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>, emp: Employee) => {
    setAnchorEl(e.currentTarget)
    setContextEmployee(emp)
  }
  const handleCloseContext = () => {
    setAnchorEl(null)
    setContextEmployee(null)
  }

  const handleEditRole = () => {
    if (!contextEmployee) return handleCloseContext()
    setEditingEmployee(contextEmployee)
    setOpenEditRoleModal(true)
    handleCloseContext()
  }

  const handleEditPhone = () => {
    if (!contextEmployee) return handleCloseContext()
    setEditingEmployee(contextEmployee)
    setOpenEditPhoneModal(true)
    handleCloseContext()
  }

  const handleEditEmail = () => {
    if (!contextEmployee) return handleCloseContext()
    setEditingEmployee(contextEmployee)
    setOpenEditEmailModal(true)
    handleCloseContext()
  }

  const handleToggleStatus = async () => {
    if (!contextEmployee) return handleCloseContext()
    try {
      const newStatus = contextEmployee.status === 'ACTIVE' ? false : true
      await updateEmployeeStatus(contextEmployee.userId, newStatus)
      enqueueSnackbar('Статус обновлен', { variant: 'success' })
      await fetchEmployees()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при обновлении статуса', { variant: 'error' })
    } finally {
      handleCloseContext()
    }
  }

  const handleAssignHead = async () => {
    if (!contextEmployee) return handleCloseContext()
    try {
      await assignAsHead(contextEmployee.userId)
      enqueueSnackbar('Назначено руководителем', { variant: 'success' })
      await fetchEmployees()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при назначении', { variant: 'error' })
    } finally {
      handleCloseContext()
    }
  }

  const handleSaveRole = async (role: EmployeeRole) => {
    if (!editingEmployee) return
    try {
      await updateEmployeeRole(editingEmployee.userId, role)
      enqueueSnackbar('Роль обновлена', { variant: 'success' })
      await fetchEmployees()
      setOpenEditRoleModal(false)
      setEditingEmployee(null)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при обновлении роли', { variant: 'error' })
      setOpenEditRoleModal(false)
      setEditingEmployee(null)
    }
  }

  const handleSavePhone = async (phone: string) => {
    if (!editingEmployee) return
    try {
      await updateEmployeePhone(editingEmployee.userId, phone)
      enqueueSnackbar('Телефон обновлен', { variant: 'success' })
      await fetchEmployees()
      setOpenEditPhoneModal(false)
      setEditingEmployee(null)
    } catch (error: any) {
      if (error?.response?.status === 409) throw error
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при обновлении телефона', { variant: 'error' })
      setOpenEditPhoneModal(false)
      setEditingEmployee(null)
    }
  }

  const handleTakePhone = async (sourceUserId: number, phone: string) => {
    if (!editingEmployee) return
    try {
      await takePhoneFrom(sourceUserId, editingEmployee.userId, phone)
      enqueueSnackbar('Телефон перенесен', { variant: 'success' })
      await fetchEmployees()
      setOpenEditPhoneModal(false)
      setEditingEmployee(null)
    } catch (error: any) {
      if (error?.response?.status === 409) throw error
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при переносе номера', { variant: 'error' })
      setOpenEditPhoneModal(false)
      setEditingEmployee(null)
    }
  }

  const handleSaveEmail = async (email: string) => {
    if (!editingEmployee) return
    try {
      await updateEmployeeEmail(editingEmployee.userId, email)
      enqueueSnackbar('Email обновлен', { variant: 'success' })
      await fetchEmployees()
      setOpenEditEmailModal(false)
      setEditingEmployee(null)
    } catch (error: any) {
      if (error?.response?.status === 409) throw error
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при обновлении', { variant: 'error' })
      setOpenEditEmailModal(false)
      setEditingEmployee(null)
    }
  }

  return (
    <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h2" sx={{ fontWeight: 700, color: '#32353a', fontSize: '2rem' }}>
        Сотрудники
      </Typography>

      {/* Панель поиска/фильтра/добавления — БЕЗ общей подложки (как Newton) */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap:2,
          width: '100%',
        }}
      >
        <TextField
          placeholder="Поиск по ФИО, номеру, email..."
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: 56,
              borderRadius: 2,
              bgcolor: '#fff', // инпут сам по себе белый, но без общего Paper
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setOpenFilterModal(true)}
            sx={{
              height: 56,
              borderRadius: 2,
              px: 3,
              bgcolor: '#fff', // кнопка на белом фоне без общей карточки
            }}
          >
            Фильтр
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{ height: 56, borderRadius: 2, px: 3 }}
          >
            Добавить
          </Button>
        </Stack>
      </Box>

      <Paper
        sx={{
          
          bgcolor: '#fff',
          p: 0,
          borderRadius: 2,
          boxShadow: '0 0 2px 0 rgba(145,158,171,0.20), 0 12px 24px -4px rgba(145,158,171,0.12)',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        {loading && employees.length === 0 && (
          <Box sx={{ position: 'relative', minHeight: 300 }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                zIndex: 1,
              }}
            >
              <CircularProgress size={48} thickness={4} />
            </Box>
          </Box>
        )}

        {employees.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Сотрудники не найдены</Box>
        ) : (
          <TableContainer>
            <Table sx={{ bgcolor: '#FFFFFF' }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#F3F6FB',
                    '& .MuiTableCell-root': {
                      bgcolor: '#F3F6FB',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#637381',
                      borderBottom: '1px solid rgba(145,158,171,0.20)',
                      py: 1,
                      px: 3,
                    },
                  }}
                >
                  <TableCell>ID</TableCell>
                  <TableCell>ФИО</TableCell>
                  <TableCell>WhatsApp</TableCell>
                  <TableCell>Документ</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {employees.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8, position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            `radial-gradient(900px 500px at 80% 10%, rgba(46, 97, 255, 0.14), transparent 60%),
                             radial-gradient(700px 450px at 20% 20%, rgba(156, 81, 255, 0.12), transparent 60%),
                             radial-gradient(900px 600px at 30% 90%, rgba(255, 92, 122, 0.10), transparent 55%),
                             #F6F8FB`,
                          pointerEvents: 'none',
                        }}
                      />
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="body1" color="text.secondary">
                          Нет сотрудников для отображения
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow
                      key={employee.userId}
                      hover
                      sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 3 } }}
                    >
                      <TableCell>{employee.userId}</TableCell>
                      <TableCell>{`${employee.lastName} ${employee.firstName}`}</TableCell>
                      <TableCell>{employee.phoneNumber ? formatPhoneForUi(employee.phoneNumber) : '-'}</TableCell>
                      <TableCell>{employee.iin || '-'}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>
                        {employee.status === 'ACTIVE' ? (
                          <Chip
                            label="Активный"
                            sx={{
                              height: 24,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: '#22C55E',
                              color: '#fff',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Неактивный"
                            sx={{
                              height: 24,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: 'rgba(145,158,171,0.18)',
                              color: '#637381',
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleContextMenu(e, employee)}
                          disabled={!isHeadOrDirector}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={total}
        rowsPerPage={size}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => setSize(parseInt(e.target.value, 10))}
      />

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContext}>
        <MenuItem onClick={handleEditRole}>Редактировать роль</MenuItem>
        <MenuItem onClick={handleEditEmail}>Редактировать email</MenuItem>
        <MenuItem onClick={handleEditPhone}>Редактировать номер</MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {contextEmployee?.status === 'ACTIVE' ? 'Деактивировать' : 'Активировать'}
        </MenuItem>
        {isDirector && <MenuItem onClick={handleAssignHead}>Назначить руководителем</MenuItem>}
      </Menu>

      <AddEmployeeModal open={openAddModal} onClose={() => setOpenAddModal(false)} onSuccess={fetchEmployees} />

      <FilterModal
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        onApply={(roles, statuses) => {
          setSelectedRoles(roles)
          setSelectedStatuses(statuses)
        }}
        initialRoles={selectedRoles}
        initialStatuses={selectedStatuses}
      />

      <EditRoleModal
        open={openEditRoleModal}
        onClose={() => setOpenEditRoleModal(false)}
        onSave={handleSaveRole}
        initialRole={editingEmployee?.role as EmployeeRole}
      />

      <EditPhoneModal
        open={openEditPhoneModal}
        onClose={() => setOpenEditPhoneModal(false)}
        onSave={handleSavePhone}
        onTakePhone={handleTakePhone}
        currentPhone={editingEmployee?.phoneNumber || ''}
      />

      <EditEmailModal
        open={openEditEmailModal}
        onClose={() => setOpenEditEmailModal(false)}
        onSave={handleSaveEmail}
        currentEmail={editingEmployee?.email || ''}
      />
    </Box>
  )
}

export default EmployeesPage
