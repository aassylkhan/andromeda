import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress,
} from '@mui/material'
import type { EmployeeRole, EmployeeStatus, Employee } from '../../entities/employee/types'
import { ROLE_LABELS, STATUS_LABELS } from '../../entities/employee/types'
import { getSupervisors } from '../../entities/employee/api'

interface FilterModalProps {
  open: boolean
  onClose: () => void
  onApply: (roles: EmployeeRole[], statuses: EmployeeStatus[], supervisors: number[]) => void
  initialRoles?: EmployeeRole[]
  initialStatuses?: EmployeeStatus[]
  initialSupervisors?: number[]
}

const ROLE_OPTIONS: EmployeeRole[] = ['DIRECTOR', 'HEAD', 'ACCOUNTANT', 'CURATOR', 'TEACHER', 'EXPERT']
const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'INACTIVE']

export function FilterModal({
  open,
  onClose,
  onApply,
  initialRoles = [],
  initialStatuses = [],
  initialSupervisors = [],
}: FilterModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<Set<EmployeeRole>>(new Set(initialRoles))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EmployeeStatus>>(new Set(initialStatuses))
  const [selectedSupervisors, setSelectedSupervisors] = useState<Set<number>>(new Set(initialSupervisors))
  const [supervisorsList, setSupervisorsList] = useState<Employee[]>([])
  const [supervisorsLoading, setSupervisorsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedRoles(new Set(initialRoles))
      setSelectedStatuses(new Set(initialStatuses))
      setSelectedSupervisors(new Set(initialSupervisors))

      const fetchSupervisors = async () => {
        setSupervisorsLoading(true)
        try {
          const data = await getSupervisors()
          setSupervisorsList(data)
        } catch {
          setSupervisorsList([])
        } finally {
          setSupervisorsLoading(false)
        }
      }
      fetchSupervisors()
    }
  }, [open])

  const handleApply = () => {
    onApply(Array.from(selectedRoles), Array.from(selectedStatuses), Array.from(selectedSupervisors))
    onClose()
  }

  const handleReset = () => {
    setSelectedRoles(new Set())
    setSelectedStatuses(new Set())
    setSelectedSupervisors(new Set())
  }

  const toggleSet = <T,>(set: Set<T>, value: T, checked: boolean): Set<T> => {
    const next = new Set(set)
    checked ? next.add(value) : next.delete(value)
    return next
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Фильтры</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <FormControl fullWidth>
            <FormLabel>Должность</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {ROLE_OPTIONS.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={selectedRoles.has(role)}
                      onChange={(e) => setSelectedRoles(toggleSet(selectedRoles, role, e.target.checked))}
                    />
                  }
                  label={ROLE_LABELS[role]}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Статус</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {STATUS_OPTIONS.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={selectedStatuses.has(status)}
                      onChange={(e) => setSelectedStatuses(toggleSet(selectedStatuses, status, e.target.checked))}
                    />
                  }
                  label={STATUS_LABELS[status]}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Руководитель</FormLabel>
            {supervisorsLoading ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <FormGroup sx={{ mt: 1 }}>
                {supervisorsList.map((s) => (
                  <FormControlLabel
                    key={s.userId}
                    control={
                      <Checkbox
                        checked={selectedSupervisors.has(s.userId)}
                        onChange={(e) => setSelectedSupervisors(toggleSet(selectedSupervisors, s.userId, e.target.checked))}
                      />
                    }
                    label={`${s.lastName} ${s.firstName}`}
                  />
                ))}
              </FormGroup>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Сбросить</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button onClick={handleApply} variant="contained">
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
