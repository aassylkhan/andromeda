import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useSnackbar } from 'notistack'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material'
import {
  updateEmployeePhone,
  takePhoneFrom,
  isEmployeesConflictError,
  type Employee,
  type UpdatePhoneRequest,
  type ExistingUserInfo,
} from '../../entities/employee'
import { updatePhoneSchema } from './schemas'

interface EditPhoneDialogProps {
  open: boolean
  employee: Employee | null
  onClose: () => void
  onSuccess: () => void
}

export function EditPhoneDialog({ open, employee, onClose, onSuccess }: EditPhoneDialogProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictUser, setConflictUser] = useState<ExistingUserInfo | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    resolver: yupResolver(updatePhoneSchema),
    defaultValues: {
      phoneNumber: employee?.phoneNumber || '',
    },
  })

  // Обновляем форму при изменении employee
  useEffect(() => {
    if (employee) {
      reset({
        phoneNumber: employee.phoneNumber || '',
      })
    }
  }, [employee, reset])

  const onSubmit = async (data: UpdatePhoneRequest) => {
    if (!employee) return
    setIsSubmitting(true)
    try {
      await updateEmployeePhone(employee.userId, data.phoneNumber)
      enqueueSnackbar('Успешно сохранено', { variant: 'success' })
      reset()
      onClose()
      onSuccess()
    } catch (error: unknown) {
      if (isEmployeesConflictError(error)) {
        // Set conflict user from error details
        if (error.existingUser) {
          setConflictUser(error.existingUser)
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении номера'
        enqueueSnackbar(errorMessage, { variant: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTakePhone = async () => {
    if (!employee || !conflictUser) return
    setIsSubmitting(true)
    try {
      await takePhoneFrom(employee.userId, conflictUser.userId, getValues('phoneNumber'))
      enqueueSnackbar('Успешно сохранено', { variant: 'success' })
      reset()
      setConflictUser(null)
      onClose()
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = isEmployeesConflictError(error)
        ? error.message
        : error instanceof Error ? error.message : 'Ошибка при отборе номера'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (conflictUser) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Пользователь с таким номером уже существует</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Вот его данные:
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography>
              <strong>ID:</strong> {conflictUser.userId}
            </Typography>
            <Typography>
              <strong>Фамилия и имя:</strong> {conflictUser.lastName} {conflictUser.firstName}
            </Typography>
            <Typography>
              <strong>WhatsApp номер:</strong> {conflictUser.phoneNumber}
            </Typography>
            <Typography>
              <strong>ИИН:</strong> {conflictUser.iin}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictUser(null)}>Отменить</Button>
          <Button onClick={handleTakePhone} color="error" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Отобрать номер'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать номер</DialogTitle>
      <DialogContent>
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="WhatsApp номер"
              type="tel"
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
              margin="normal"
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отменить</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
