import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { updateEmployee, getSupervisors } from '../../entities/employee/api'
import type { Employee } from '../../entities/employee/types'
import { ASSIGNABLE_ROLES } from '../../entities/employee/types'

interface EditEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  employee: Employee | null
}

export function EditEmployeeModal({ open, onClose, onSuccess, employee }: EditEmployeeModalProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('')
  const [supervisorId, setSupervisorId] = useState<number | ''>('')
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  const [supervisorsLoading, setSupervisorsLoading] = useState(false)

  useEffect(() => {
    if (open && employee) {
      setRole(employee.role)
      setSupervisorId(employee.supervisorId ?? '')

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
  }, [open, employee])

  if (!employee) return null

  const handleSave = async () => {
    if (!role || !supervisorId) return
    setLoading(true)
    try {
      await updateEmployee(employee.userId, {
        role,
        supervisorId: supervisorId as number,
      })
      enqueueSnackbar('Данные обновлены', { variant: 'success' })
      onClose()
      onSuccess()
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать сотрудника</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
        <Button onClick={onClose} disabled={loading}>Отменить</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || !role || !supervisorId}>
          {loading ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
