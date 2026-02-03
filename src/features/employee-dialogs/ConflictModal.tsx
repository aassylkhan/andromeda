import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import type { EmployeeCreateResultDto } from '../../entities/employee/types'

export type ConflictType =
  | 'PHONE_TAKEN'
  | 'EMAIL_TAKEN'
  | 'USER_EXISTS_NOT_EMPLOYEE'
  | 'EMPLOYEE_ALREADY_EXISTS'
  | 'EDIT_PHONE_CONFLICT'
  | 'EDIT_EMAIL_CONFLICT'

interface ConflictModalProps {
  open: boolean
  conflictType: ConflictType | null
  conflictUser?: EmployeeCreateResultDto['conflictUser'] | { id: number; lastName: string; firstName: string; phoneNumber?: string | null; pnOrIin?: string; email?: string | null }
  onClose: () => void
  onConfirm?: () => Promise<void>
  confirmLabel?: string
  loading?: boolean
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  open,
  conflictType,
  conflictUser,
  onClose,
  onConfirm,
  confirmLabel = 'Подтвердить',
  loading = false,
}) => {
  const getTitle = (): string => {
    switch (conflictType) {
      case 'PHONE_TAKEN':
        return 'Номер телефона занят'
      case 'EMAIL_TAKEN':
        return 'Email занят'
      case 'USER_EXISTS_NOT_EMPLOYEE':
        return 'Пользователь существует в системе'
      case 'EMPLOYEE_ALREADY_EXISTS':
        return 'Сотрудник уже существует'
      case 'EDIT_PHONE_CONFLICT':
        return 'Номер телефона занят'
      case 'EDIT_EMAIL_CONFLICT':
        return 'Email занят'
      default:
        return 'Конфликт'
    }
  }

  const getDescription = (): string => {
    switch (conflictType) {
      case 'PHONE_TAKEN':
        return 'Этот номер телефона занят другим пользователем'
      case 'EMAIL_TAKEN':
        return 'Этот email занят другим пользователем'
      case 'USER_EXISTS_NOT_EMPLOYEE':
        return 'Этот пользователь уже существует в системе, но не как сотрудник'
      case 'EMPLOYEE_ALREADY_EXISTS':
        return 'Такой сотрудник уже существует'
      case 'EDIT_PHONE_CONFLICT':
        return 'Пользователь с таким номером уже существует'
      case 'EDIT_EMAIL_CONFLICT':
        return 'Пользователь с таким email уже существует'
      default:
        return 'Произошла ошибка'
    }
  }

  const showActionButton = (): boolean => {
    return (
      conflictType === 'PHONE_TAKEN' ||
      conflictType === 'USER_EXISTS_NOT_EMPLOYEE' ||
      conflictType === 'EDIT_PHONE_CONFLICT'
    )
  }

  const getCancelButtonLabel = (): string => {
    switch (conflictType) {
      case 'EMAIL_TAKEN':
      case 'EMPLOYEE_ALREADY_EXISTS':
      case 'EDIT_EMAIL_CONFLICT':
        return 'Закрыть'
      default:
        return 'Отменить'
    }
  }

  const getConfirmButtonLabel = (): string => {
    if (confirmLabel) return confirmLabel
    switch (conflictType) {
      case 'PHONE_TAKEN':
        return 'Отобрать номер'
      case 'USER_EXISTS_NOT_EMPLOYEE':
        return 'Добавить как сотрудника'
      case 'EDIT_PHONE_CONFLICT':
        return 'Отобрать номер'
      default:
        return 'Подтвердить'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: 'warning.main' }} />
        {getTitle()}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            {getDescription()}
          </Typography>

          {conflictUser && (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Информация пользователя:
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {conflictUser.id}
              </Typography>
              <Typography variant="body2">
                <strong>ФИО:</strong> {conflictUser.lastName} {conflictUser.firstName}
              </Typography>
              {conflictUser.phoneNumber && (
                <Typography variant="body2">
                  <strong>Номер:</strong> {conflictUser.phoneNumber}
                </Typography>
              )}
              {conflictUser.pnOrIin && (
                <Typography variant="body2">
                  <strong>Документ:</strong> {conflictUser.pnOrIin}
                </Typography>
              )}
              {conflictUser.email && (
                <Typography variant="body2">
                  <strong>Email:</strong> {conflictUser.email}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {getCancelButtonLabel()}
        </Button>
        {showActionButton() && (
          <Button
            onClick={onConfirm}
            variant="contained"
            disabled={loading || !onConfirm}
            sx={{ position: 'relative' }}
          >
            {loading && (
              <CircularProgress size={20} sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
            )}
            <span style={{ visibility: loading ? 'hidden' : 'visible' }}>{getConfirmButtonLabel()}</span>
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
