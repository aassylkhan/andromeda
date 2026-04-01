import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useSnackbar } from 'notistack'
import { getStudentsWithoutCurator, assignCurator } from '../../entities/student/api'
import type { StudentWithoutCurator } from '../../entities/student/api'
import { getCurators } from '../../entities/lookup/api'
import type { LookupDto } from '../../entities/lookup/types'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)',
  py: 1.5, px: 2, whiteSpace: 'nowrap',
} as const

const formatDateOnly = (iso: string) => {
  try {
    const parts = iso.split('-')
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
    return iso
  } catch { return iso }
}

const CuratorAssignmentPage: React.FC = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const [students, setStudents] = useState<StudentWithoutCurator[]>([])
  const [curators, setCurators] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<Record<number, number | ''>>({})
  const [assigning, setAssigning] = useState<number | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<StudentWithoutCurator | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getStudentsWithoutCurator(), getCurators()])
      setStudents(s)
      setCurators(c)
    } catch {
      enqueueSnackbar('Ошибка загрузки данных', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [enqueueSnackbar])

  useEffect(() => { load() }, [load])

  const getCuratorName = (studentId: number): string => {
    const curatorId = selections[studentId]
    if (!curatorId) return ''
    const c = curators.find((x) => x.id === curatorId)
    return c?.name ?? ''
  }

  const handleAssignClick = (s: StudentWithoutCurator) => {
    const curatorId = selections[s.studentId]
    if (!curatorId) {
      enqueueSnackbar('Выберите куратора', { variant: 'warning' })
      return
    }
    setConfirmTarget(s)
    setConfirmOpen(true)
  }

  const handleConfirmAssign = async () => {
    if (!confirmTarget) return
    const s = confirmTarget
    const curatorId = selections[s.studentId]
    setConfirmOpen(false)
    setConfirmTarget(null)

    if (!curatorId) return

    setAssigning(s.studentId)
    try {
      await assignCurator(s.studentId, curatorId as number)
      enqueueSnackbar(`Куратор назначен для ${s.lastName} ${s.firstName}`, { variant: 'success' })
      setStudents((prev) => prev.filter((st) => st.studentId !== s.studentId))
      setSelections((prev) => { const n = { ...prev }; delete n[s.studentId]; return n })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка назначения куратора'
      setErrorModal(msg)
    } finally {
      setAssigning(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button variant="text" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')}>
          Назад
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Назначение куратора</Typography>
        {!loading && students.length > 0 && (
          <Chip
            label={`${students.length} ${students.length === 1 ? 'ученик' : students.length < 5 ? 'ученика' : 'учеников'}`}
            size="small"
            sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }}
          />
        )}
      </Box>

      {curators.length === 0 && !loading && (
        <Typography variant="body2" color="warning.main" sx={{ px: 1 }}>
          Нет активных кураторов. Добавьте сотрудника с ролью «Куратор» и статусом «Активный».
        </Typography>
      )}

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>
        ) : students.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">Все ученики с часами уже имеют кураторов</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={TH_SX}>Фамилия и имя</TableCell>
                  <TableCell sx={TH_SX}>Класс</TableCell>
                  <TableCell sx={TH_SX}>Продукт</TableCell>
                  <TableCell sx={TH_SX}>Отделение</TableCell>
                  <TableCell sx={TH_SX}>Филиал</TableCell>
                  <TableCell sx={TH_SX}>Время обучения</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Гр. офф</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Инд. офф</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'center' }}>Инд. онл</TableCell>
                  <TableCell sx={TH_SX}>Дата начала</TableCell>
                  <TableCell sx={{ ...TH_SX, minWidth: 220 }}>Куратор</TableCell>
                  <TableCell sx={TH_SX} />
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.studentId} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2, whiteSpace: 'nowrap' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{s.lastName} {s.firstName}</TableCell>
                    <TableCell>{s.gradeName ?? '—'}</TableCell>
                    <TableCell>{s.productName ?? '—'}</TableCell>
                    <TableCell>{s.learningLanguageName ?? '—'}</TableCell>
                    <TableCell>{s.officeName ?? '—'}</TableCell>
                    <TableCell>{s.learningHourOptionName ?? '—'}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineGroupHours}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineIndividualHours}</TableCell>
                    <TableCell align="center">{s.amountOfOnlineIndividualHours}</TableCell>
                    <TableCell>{s.offerStartDate ? formatDateOnly(s.offerStartDate) : '—'}</TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth
                        value={selections[s.studentId] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setSelections((prev) => ({ ...prev, [s.studentId]: val === '' ? '' : Number(val) }))
                        }}
                      >
                        <MenuItem value="">
                          <em>Выберите куратора</em>
                        </MenuItem>
                        {curators.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained" size="small"
                        disabled={!selections[s.studentId] || assigning === s.studentId}
                        onClick={() => handleAssignClick(s)}
                        sx={{ minWidth: 100 }}
                      >
                        {assigning === s.studentId ? <CircularProgress size={18} /> : 'Назначить'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmTarget(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Назначить куратора <strong>{confirmTarget ? getCuratorName(confirmTarget.studentId) : ''}</strong> для ученика{' '}
            <strong>{confirmTarget?.lastName} {confirmTarget?.firstName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmOpen(false); setConfirmTarget(null) }}>Отмена</Button>
          <Button variant="contained" onClick={handleConfirmAssign}>Назначить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!errorModal} onClose={() => setErrorModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent><Typography variant="body1" sx={{ mt: 1 }}>{errorModal}</Typography></DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setErrorModal(null)}>ОК</Button></DialogActions>
      </Dialog>
    </Box>
  )
}

export default CuratorAssignmentPage
