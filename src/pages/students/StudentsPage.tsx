import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TablePagination,
  CircularProgress,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { getStudents, addStudent } from '../../entities/student/api'
import type { StudentListItem } from '../../entities/student/types'
import { StudentFilterDialog, emptyFilters } from '../../features/student-dialogs/StudentFilterDialog'
import type { StudentFilters } from '../../features/student-dialogs/StudentFilterDialog'
import { AddStudentDialog } from '../../features/student-dialogs/AddStudentDialog'

const TH_SX = {
  fontWeight: 600,
  fontSize: '0.8rem',
  color: '#637381',
  bgcolor: '#F3F6FB',
  borderBottom: '1px solid rgba(145,158,171,0.20)',
  py: 1.5,
  px: 2,
  whiteSpace: 'nowrap',
} as const

const StudentsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [students, setStudents] = useState<StudentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StudentFilters>(emptyFilters)

  const [filterOpen, setFilterOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 400)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const result = await getStudents({
        page,
        size,
        q: debouncedSearch || undefined,
        ...filters,
      })
      setStudents(result.items)
      setTotal(result.total)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при загрузке', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setPage(0), [debouncedSearch, filters])
  useEffect(() => {
    fetchStudents()
  }, [page, size, debouncedSearch, filters])

  const handleAddStudent = async (userId: number) => {
    try {
      await addStudent(userId)
      enqueueSnackbar('Ученик добавлен', { variant: 'success' })
      await fetchStudents()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Ошибка')
      setErrorModal(msg)
      throw err
    }
  }

  const curatorName = (s: StudentListItem) => {
    if (!s.curatorLastName) return '—'
    return `${s.curatorLastName} ${s.curatorFirstName ?? ''}`.trim()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Ученики
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
            onClick={() => setFilterOpen(true)}
            sx={{ height: 48, borderRadius: 2, px: 3, bgcolor: '#fff' }}
          >
            Фильтр
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ height: 48, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
          >
            Добавить
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {loading && students.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <CircularProgress size={48} />
          </Box>
        ) : students.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Ученики не найдены</Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...TH_SX, width: 60 }}>ID</TableCell>
                  <TableCell sx={TH_SX}>Фамилия и имя</TableCell>
                  <TableCell sx={TH_SX}>Номер телефона</TableCell>
                  <TableCell sx={TH_SX}>Класс</TableCell>
                  <TableCell sx={TH_SX}>Продукт</TableCell>
                  <TableCell sx={TH_SX}>Язык обучения</TableCell>
                  <TableCell sx={TH_SX}>Офис</TableCell>
                  <TableCell sx={TH_SX}>Время обучения</TableCell>
                  <TableCell sx={TH_SX}>Куратор</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Гр. офф.</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Инд. офф.</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Инд. онл.</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Заморозки</TableCell>
                  <TableCell sx={TH_SX}>Дата начала</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow
                    key={s.studentId}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2, whiteSpace: 'nowrap' },
                    }}
                    onClick={() => navigate(`/students/${s.studentId}`)}
                  >
                    <TableCell>{s.studentId}</TableCell>
                    <TableCell>{s.lastName} {s.firstName}</TableCell>
                    <TableCell>{s.phoneNumber ? formatPhoneForUi(s.phoneNumber) : '—'}</TableCell>
                    <TableCell>{s.gradeName ?? '—'}</TableCell>
                    <TableCell>{s.productName ?? '—'}</TableCell>
                    <TableCell>{s.learningLanguageName ?? '—'}</TableCell>
                    <TableCell>{s.officeName ?? '—'}</TableCell>
                    <TableCell>{s.learningHourOptionName ?? '—'}</TableCell>
                    <TableCell>{curatorName(s)}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineGroupHours}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineIndividualHours}</TableCell>
                    <TableCell align="center">{s.amountOfOnlineIndividualHours}</TableCell>
                    <TableCell align="center">{s.freezings}</TableCell>
                    <TableCell>{s.offgrStartDate ?? '—'}</TableCell>
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

      <StudentFilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        initial={filters}
      />

      <AddStudentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddStudent}
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

export default StudentsPage
