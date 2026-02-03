import { useState } from 'react'
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
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material'
import { 
  createEmployee, 
  toEmployeeCreateRequest,
  type CreateEmployeeRequest,
  type ExistingUserInfo,
  isEmployeesConflictError,
  takePhoneAndCreate,
  confirmExistingEmployee,
} from '../../entities/employee'
import { createEmployeeSchema } from './schemas'
import { ExistingUserDialog } from './ExistingUserDialog'
import { EmployeeExistsDialog } from './EmployeeExistsDialog'
import { RefusalDialog } from './RefusalDialog'
import { determineConflictScenario, hasValidExistingUserData, type ConflictScenario } from './conflict-utils'

interface CreateEmployeeDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ConflictState {
  scenario: ConflictScenario
  existingUser: ExistingUserInfo | null
  formData: CreateEmployeeRequest
  errorMessage: string
}

export function CreateEmployeeDialog({ open, onClose, onSuccess }: CreateEmployeeDialogProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictState, setConflictState] = useState<ConflictState | null>(null)
  const [showRefusal, setShowRefusal] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(createEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      iin: '',
      notCitizen: false,
      role: 'expert' as const,
    },
  })

  const notCitizen = watch('notCitizen')

  const onSubmit = async (data: unknown) => {
    const formData = data as CreateEmployeeRequest
    setIsSubmitting(true)
    try {
      // Если не гражданин РК и ИИН пустой, устанавливаем значение по умолчанию
      const payload = {
        ...formData,
        iin: formData.notCitizen && !formData.iin ? '000000000000' : formData.iin
      }
      await createEmployee(toEmployeeCreateRequest(payload))
      enqueueSnackbar('Сотрудник добавлен', { variant: 'success' })
      reset()
      onClose()
      onSuccess()
    } catch (error: unknown) {
      if (isEmployeesConflictError(error)) {
        const scenario = determineConflictScenario(error)
        const hasData = hasValidExistingUserData(error)

        if (!hasData) {
          // Show warning if backend didn't provide user data
          enqueueSnackbar('Бэк не вернул данные существующего пользователя', { variant: 'warning' })
          setConflictState({
            scenario,
            existingUser: null,
            formData,
            errorMessage: error.message || 'Конфликт при добавлении сотрудника',
          })
        } else {
          setConflictState({
            scenario,
            existingUser: error.existingUser || null,
            formData,
            errorMessage: error.message || 'Конфликт при добавлении сотрудника',
          })
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при добавлении сотрудника'
        enqueueSnackbar(errorMessage, { variant: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setConflictState(null)
    setShowRefusal(false)
    onClose()
  }

  const handleConflictClose = () => {
    setConflictState(null)
  }

  const handleExistingUserConfirm = async () => {
    if (!conflictState?.existingUser) return
    
    setIsSubmitting(true)
    try {
      const payload = {
        ...conflictState.formData,
        iin: conflictState.formData.notCitizen && !conflictState.formData.iin 
          ? '000000000000' 
          : conflictState.formData.iin
      }
      await confirmExistingEmployee(conflictState.existingUser.userId, payload.role)
      enqueueSnackbar('Сотрудник добавлен', { variant: 'success' })
      reset()
      setConflictState(null)
      onClose()
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при подтверждении пользователя'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmployeeExistsConfirm = () => {
    // Show refusal dialog
    setShowRefusal(true)
  }

  const handleTakePhone = async () => {
    if (!conflictState?.existingUser) return
    
    setIsSubmitting(true)
    try {
      const payload = {
        ...conflictState.formData,
        iin: conflictState.formData.notCitizen && !conflictState.formData.iin 
          ? '000000000000' 
          : conflictState.formData.iin
      }
      await takePhoneAndCreate(conflictState.existingUser.userId, toEmployeeCreateRequest(payload))
      enqueueSnackbar('Сотрудник добавлен', { variant: 'success' })
      reset()
      setConflictState(null)
      onClose()
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отборе номера'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefusalClose = () => {
    setShowRefusal(false)
    setConflictState(null)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить сотрудника</DialogTitle>
        <DialogContent>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Фамилия"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                margin="normal"
                required
              />
            )}
          />
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Имя"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                margin="normal"
                required
              />
            )}
          />
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
                required
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Gmail"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                margin="normal"
                required
              />
            )}
          />
          <Controller
            name="iin"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="ИИН"
                error={!!errors.iin}
                helperText={errors.iin?.message}
                margin="normal"
                required={!notCitizen}
                disabled={notCitizen}
              />
            )}
          />
          <Controller
            name="notCitizen"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label="Не гражданин РК"
              />
            )}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Роль"
                error={!!errors.role}
                helperText={errors.role?.message}
                margin="normal"
                required
              >
                <MenuItem value="expert">Expert</MenuItem>
                <MenuItem value="mentor">Mentor</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="accountant">Accountant</MenuItem>
              </TextField>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Show refusal dialog first if user confirmed "это он" in EmployeeExistsDialog */}
      {showRefusal && (
        <RefusalDialog
          open={showRefusal}
          onClose={handleRefusalClose}
        />
      )}

      {/* ExistingUserDialog - for "Пользователь с таким номером уже существует" scenario */}
      {conflictState && conflictState.scenario === 'USER_EXISTS' && !showRefusal && (
        <ExistingUserDialog
          open={!!conflictState}
          existingUser={conflictState.existingUser}
          errorMessage={conflictState.errorMessage}
          isSubmitting={isSubmitting}
          onConfirm={handleExistingUserConfirm}
          onTakePhone={handleTakePhone}
          onClose={handleConflictClose}
        />
      )}

      {/* EmployeeExistsDialog - for "Сотрудник с таким номером телефона уже существует" scenario */}
      {conflictState && conflictState.scenario === 'EMPLOYEE_EXISTS' && !showRefusal && (
        <EmployeeExistsDialog
          open={!!conflictState}
          existingUser={conflictState.existingUser}
          errorMessage={conflictState.errorMessage}
          isSubmitting={isSubmitting}
          onConfirm={handleEmployeeExistsConfirm}
          onTakePhone={handleTakePhone}
          onClose={handleConflictClose}
        />
      )}
    </>
  )
}
