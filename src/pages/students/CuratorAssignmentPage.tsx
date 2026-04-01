import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
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

const CuratorAssignmentPage: React.FC = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const [students, setStudents] = useState<StudentWithoutCurator[]>([])
  const [curators, setCurators] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<Record<number, number | ''>>({})
  const [assigning, setAssigning] = useState<number | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)

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

  const handleAssign = async (s: StudentWithoutCurator) => {
    const curatorId = selections[s.studentId]
    if (!curatorId) {
      enqueueSnackbar('Выберите куратора', { variant: 'warning' })
      return
    }
    setAssigning(s.studentId)
    try {
      await assignCurator(s.studentId, curatorId as number)
      enqueueSnackbar(`Куратор назначен для ${s.lastName} ${s.firstName}`, { variant: 'success' })
      setStudents((prev) => prev.filter((st) => st.studentId !== s.studentId))
      setSelections((prev) => { const n = { ...prev }; delete n[s.studentId]; return n })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка назначения'
      setErrorModal(msg)
    } finally {
      setAssigning(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button variant="text" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')}>
          Назад
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Назначение куратора</Typography>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>
        ) : students.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Все ученики имеют кураторов</Box>
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
                  <TableCell sx={{ ...TH_SX, minWidth: 200 }}>Куратор</TableCell>
                  <TableCell sx={TH_SX} />
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.studentId} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2, whiteSpace: 'nowrap' } }}>
                    <TableCell>{s.lastName} {s.firstName}</TableCell>
                    <TableCell>{s.gradeName ?? '—'}</TableCell>
                    <TableCell>{s.productName ?? '—'}</TableCell>
                    <TableCell>{s.learningLanguageName ?? '—'}</TableCell>
                    <TableCell>{s.officeName ?? '—'}</TableCell>
                    <TableCell>{s.learningHourOptionName ?? '—'}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineGroupHours}</TableCell>
                    <TableCell align="center">{s.amountOfOfflineIndividualHours}</TableCell>
                    <TableCell align="center">{s.amountOfOnlineIndividualHours}</TableCell>
                    <TableCell>{s.offgrStartDate ?? '—'}</TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth
                        value={selections[s.studentId] ?? ''}
                        onChange={(e) => setSelections((prev) => ({ ...prev, [s.studentId]: Number(e.target.value) }))}
                      >
                        <MenuItem value="">—</MenuItem>
                        {curators.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained" size="small"
                        disabled={!selections[s.studentId] || assigning === s.studentId}
                        onClick={() => handleAssign(s)}
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

      <Dialog open={!!errorModal} onClose={() => setErrorModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent><Typography variant="body1" sx={{ mt: 1 }}>{errorModal}</Typography></DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setErrorModal(null)}>ОК</Button></DialogActions>
      </Dialog>
    </Box>
  )
}

export default CuratorAssignmentPage
