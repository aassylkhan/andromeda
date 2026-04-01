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

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
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

  const loadRates = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    try {
      setRates(await getTeacherRates(employee.userId))
    } catch {
      enqueueSnackbar('Ошибка загрузки ставок', { variant: 'error' })
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
          Редактировать ставки — {employee?.lastName} {employee?.firstName}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
          ) : rates.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Ставки не найдены</Typography>
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
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>{r.createdByFullName}</TableCell>
                      <TableCell>{r.subjectName}</TableCell>
                      <TableCell>{r.rate.toLocaleString()}</TableCell>
                      <TableCell>{r.activationDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAddOpen(true)}>Добавить</Button>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {employee && (
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
