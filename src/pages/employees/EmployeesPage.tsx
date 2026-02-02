import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Menu,
  MenuItem,
  TableContainer,
  TablePagination,
  Chip,
  InputAdornment,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useEmployeeStore } from '../../entities/employee'
import { useAuthStore } from '../../entities/auth'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import { useDebounce } from '../../shared/hooks'
import { formatPhoneNumber } from './utils'
import type { Employee } from '../../entities/employee'
import {
  CreateEmployeeDialog,
  EditEmployeeDialog,
  EditPhoneDialog,
  FilterDialog,
} from '../../features/employee-dialogs'
import { toggleEmployeeStatus, makeHead } from '../../entities/employee'

export default function EmployeesPage() {
  const user = useAuthStore((state) => state.user)
  const isDirector = hasAnyRole(user ?? null, ['director'])

  const {
    items,
    loading,
    error,
    roleFilter,
    statusFilter,
    total,
    page,
    size,
    setQuery,
    setRoleFilter,
    setStatusFilter,
    setPage,
    setSize,
    fetchEmployees,
    refetch,
  } = useEmployeeStore()

  const [q, setQ] = useState('')
  const debouncedQuery = useDebounce(q, 400)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPhoneDialogOpen, setEditPhoneDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuEmployee, setMenuEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    setQuery(debouncedQuery)
  }, [debouncedQuery, setQuery])

  useEffect(() => {
    fetchEmployees()
  }, [debouncedQuery, roleFilter, statusFilter, page, size, fetchEmployees])

  const handleSearchChange = (value: string) => {
    setQ(value)
    setPage(0)
  }

  const handleFilterApply = (role: string, status: string) => {
    setRoleFilter(role)
    setStatusFilter(status)
    setPage(0)
    setFilterDialogOpen(false)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, employee: Employee) => {
    setMenuAnchor(event.currentTarget)
    setMenuEmployee(employee)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuEmployee(null)
  }

  const handleEdit = () => {
    if (menuEmployee) {
      setSelectedEmployee(menuEmployee)
      setEditDialogOpen(true)
    }
    handleMenuClose()
  }

  const handleEditPhone = () => {
    if (menuEmployee) {
      setSelectedEmployee(menuEmployee)
      setEditPhoneDialogOpen(true)
    }
    handleMenuClose()
  }

  const handleToggleStatus = async () => {
    if (menuEmployee) {
      const newActiveStatus = menuEmployee.status !== 'ACTIVE'
      await toggleEmployeeStatus(menuEmployee.userId, newActiveStatus)
      refetch()
    }
    handleMenuClose()
  }

  const handleMakeHead = async () => {
    if (menuEmployee) {
      await makeHead(menuEmployee.userId)
      refetch()
    }
    handleMenuClose()
  }

  const itemsSafe = Array.isArray(items) ? items : []
  const sortedItems = [...itemsSafe]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Title */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          color: '#141A21',
          fontSize: '2rem',
        }}
      >
        Сотрудники
      </Typography>

      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder="Поиск сотрудников..."
          variant="outlined"
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: '1 1 520px',
            maxWidth: 750,
            '& .MuiOutlinedInput-root': {
              height: 56,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
            },
          }}
        />

        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{
              height: 56,
              borderRadius: 2,
              px: 3,
              whiteSpace: 'nowrap',
              borderColor: 'rgba(145,158,171,0.20)',
              '&:hover': { borderColor: 'rgba(145,158,171,0.35)' },
            }}
          >
            Фильтр
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              height: 56,
              borderRadius: 2,
              px: 4,
              whiteSpace: 'nowrap',
            }}
          >
            Добавить
          </Button>
        </Stack>
      </Box>

      {/* ✅ ONE surface only — no inner “card” effect */}
      <Paper
        sx={{
          bgcolor: '#fff',
          p: 0, // ✅ ключ: убрали padding, чтобы таблица была как в Newton
          borderRadius: 2,
          boxShadow:
            '0 0 2px 0 rgba(145,158,171,0.20), 0 12px 24px -4px rgba(145,158,171,0.12)',
          overflow: 'hidden',
        }}
      >
        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {loading && (
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
          )}

          <TableContainer sx={{ overflow: 'hidden' }}>
            <Table sx={{ bgcolor: '#FFFFFF' }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#F3F6FB',
                    '& .MuiTableCell-root': {
                      bgcolor: '#F3F6FB',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#637381',
                      borderBottom: '1px solid rgba(145,158,171,0.20)',
                      py: 1.5,
                      px: 3, // ✅ боковые отступы как в Newton
                    },
                  }}
                >
                  <TableCell>ID</TableCell>
                  <TableCell>Фамилия</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell>WhatsApp номер</TableCell>
                  <TableCell>ИИН</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sortedItems.map((employee) => {
                  const isActive = employee.status === 'ACTIVE'

                  return (
                    <TableRow
                      key={employee.userId}
                      hover
                      sx={{
                        '& td': {
                          borderBottom: '1px solid rgba(145,158,171,0.12)',
                          px: 3, // ✅ боковые отступы как в Newton
                        },
                      }}
                    >
                      <TableCell>{employee.userId}</TableCell>
                      <TableCell>{employee.lastName}</TableCell>
                      <TableCell>{employee.firstName}</TableCell>
                      <TableCell>{formatPhoneNumber(employee.phoneNumber)}</TableCell>
                      <TableCell>{employee.iin}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isActive ? 'ACTIVE' : 'INACTIVE'}
                          sx={{
                            height: 24,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...(isActive
                              ? { bgcolor: '#22C55E', color: '#fff' }
                              : { bgcolor: 'rgba(145,158,171,0.18)', color: '#637381' }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, employee)}
                          aria-label="Открыть действия"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>Редактировать</MenuItem>
          <MenuItem onClick={handleEditPhone}>Редактировать номер</MenuItem>
          <MenuItem onClick={handleToggleStatus}>
            {menuEmployee?.status === 'ACTIVE' ? 'Деактивировать' : 'Активировать'}
          </MenuItem>
          {isDirector && <MenuItem onClick={handleMakeHead}>Назначить руководителем</MenuItem>}
        </Menu>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={size}
          onRowsPerPageChange={(event) => setSize(parseInt(event.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Строк на странице"
          sx={{
            borderTop: '1px solid rgba(145,158,171,0.12)',
            px: 3, // ✅ низ тоже с внутренними отступами
            mt: 0,
          }}
        />
      </Paper>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={refetch}
      />

      <EditEmployeeDialog
        open={editDialogOpen}
        employee={selectedEmployee}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={refetch}
      />

      <EditPhoneDialog
        open={editPhoneDialogOpen}
        employee={selectedEmployee}
        onClose={() => {
          setEditPhoneDialogOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={refetch}
      />

      <FilterDialog
        open={filterDialogOpen}
        initialRole={roleFilter}
        initialStatus={statusFilter}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleFilterApply}
      />
    </Box>
  )
}
