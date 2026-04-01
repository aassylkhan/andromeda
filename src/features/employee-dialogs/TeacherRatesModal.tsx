import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { getTeacherRates } from '../../entities/employee/api'
import type { TeacherRateItem } from '../../entities/employee/types'
import type { Employee } from '../../entities/employee/types'
import { AddTeacherRateModal } from './AddTeacherRateModal'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 2,
} as const

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-KZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const formatDateOnly = (iso: string) => {
  try {
    const parts = iso.split('-')
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
    return iso
  } catch { return iso }
}

const formatRate = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value) + ' ₸'
}

interface Props {
  open: boolean
  onClose: () => void
  employee: Employee | null
}

export const TeacherRatesModal: React.FC<Props> = ({ open, onClose, employee }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [rates, setRates] = useState<TeacherRateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const isTeacher = employee?.role === 'TEACHER'

  const loadRates = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    try {
      setRates(await getTeacherRates(employee.userId))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка загрузки ставок'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [employee, enqueueSnackbar])

  useEffect(() => {
    if (open && employee) loadRates()
    if (!open) setRates([])
  }, [open, employee, loadRates])

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Ставки — {employee?.lastName} {employee?.firstName}
        </DialogTitle>
        <DialogContent>
          {!isTeacher ? (
            <Typography variant="body2" color="warning.main" sx={{ py: 2 }}>
              Данный сотрудник не является преподавателем. Ставки доступны только для преподавателей.
            </Typography>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : rates.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              У преподавателя пока нет назначенных ставок
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={TH_SX}>Дата назначения</TableCell>
                    <TableCell sx={TH_SX}>Кем назначена</TableCell>
                    <TableCell sx={TH_SX}>Предмет</TableCell>
                    <TableCell sx={TH_SX}>Ставка</TableCell>
                    <TableCell sx={TH_SX}>Дата вступления в силу</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell>{r.createdByFullName}</TableCell>
                      <TableCell>{r.subjectName}</TableCell>
                      <TableCell>{formatRate(r.rate)}</TableCell>
                      <TableCell>{formatDateOnly(r.activationDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          {isTeacher && (
            <Button variant="outlined" onClick={() => setAddOpen(true)}>
              Добавить
            </Button>
          )}
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {employee && isTeacher && (
        <AddTeacherRateModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          teacherUserId={employee.userId}
          onSuccess={() => { setAddOpen(false); loadRates() }}
        />
      )}
    </>
  )
}
