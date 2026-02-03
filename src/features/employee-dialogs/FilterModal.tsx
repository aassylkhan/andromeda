import React, { useState } from 'react'
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
} from '@mui/material'
import type { EmployeeRole, EmployeeStatus } from '../../entities/employee/types'

interface FilterModalProps {
  open: boolean
  onClose: () => void
  onApply: (roles: EmployeeRole[], statuses: EmployeeStatus[]) => void
  initialRoles?: EmployeeRole[]
  initialStatuses?: EmployeeStatus[]
}

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'MENTOR', label: 'Ментор' },
  { value: 'TEACHER', label: 'Учитель' },
  { value: 'EXPERT', label: 'Эксперт' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер' },
  { value: 'HEAD', label: 'Руководитель' },
  { value: 'DIRECTOR', label: 'Директор' },
]

const STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Активный' },
  { value: 'INACTIVE', label: 'Неактивный' },
]

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApply,
  initialRoles = [],
  initialStatuses = [],
}) => {
  const [selectedRoles, setSelectedRoles] = useState<Set<EmployeeRole>>(new Set(initialRoles))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EmployeeStatus>>(new Set(initialStatuses))

  const handleRoleChange = (role: EmployeeRole, checked: boolean) => {
    const newRoles = new Set(selectedRoles)
    if (checked) {
      newRoles.add(role)
    } else {
      newRoles.delete(role)
    }
    setSelectedRoles(newRoles)
  }

  const handleStatusChange = (status: EmployeeStatus, checked: boolean) => {
    const newStatuses = new Set(selectedStatuses)
    if (checked) {
      newStatuses.add(status)
    } else {
      newStatuses.delete(status)
    }
    setSelectedStatuses(newStatuses)
  }

  const handleApply = () => {
    onApply(Array.from(selectedRoles), Array.from(selectedStatuses))
    onClose()
  }

  const handleReset = () => {
    setSelectedRoles(new Set())
    setSelectedStatuses(new Set())
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Фильтры</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <FormControl fullWidth>
            <FormLabel>Роли</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {ROLES.map((role) => (
                <FormControlLabel
                  key={role.value}
                  control={
                    <Checkbox
                      checked={selectedRoles.has(role.value)}
                      onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                    />
                  }
                  label={role.label}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Статусы</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {STATUSES.map((status) => (
                <FormControlLabel
                  key={status.value}
                  control={
                    <Checkbox
                      checked={selectedStatuses.has(status.value)}
                      onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                    />
                  }
                  label={status.label}
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Очистить</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button onClick={handleApply} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
