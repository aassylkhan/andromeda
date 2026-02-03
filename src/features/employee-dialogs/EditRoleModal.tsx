import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material'
import type { EmployeeRole } from '../../entities/employee/types'

interface EditRoleModalProps {
  open: boolean
  onClose: () => void
  onSave: (role: EmployeeRole) => Promise<void>
  initialRole?: EmployeeRole
}

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'MENTOR', label: 'Ментор' },
  { value: 'TEACHER', label: 'Учитель' },
  { value: 'EXPERT', label: 'Эксперт' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер' },
]

export const EditRoleModal: React.FC<EditRoleModalProps> = ({ open, onClose, onSave, initialRole = 'MENTOR' }) => {
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>(initialRole)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(selectedRole)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Редактировать роль</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <FormLabel>Роль</FormLabel>
            <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as EmployeeRole)} sx={{ mt: 1 }}>
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отменить
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ position: 'relative' }}>
          {loading && <CircularProgress size={20} sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />}
          <span style={{ visibility: loading ? 'hidden' : 'visible' }}>Сохранить</span>
        </Button>
      </DialogActions>
    </Dialog>
  )
}
