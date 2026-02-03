import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  CircularProgress,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { createEmployee, takePhoneAndCreate, addAsEmployee } from '../../entities/employee/api'
import { normalizePhoneDigits } from '../../shared/utils/phoneUtils'
import { isValidGmail, isValidPnOrIin } from '../../shared/utils/validationUtils'
import { ConflictModal, type ConflictType } from './ConflictModal'
import type { EmployeeCreateRequest, EmployeeCreateResultDto } from '../../entities/employee/types'

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const schema = yup.object().shape({
  lastName: yup.string().required('Фамилия обязательна').min(2, 'Минимум 2 символа'),
  firstName: yup.string().required('Имя обязательно').min(2, 'Минимум 2 символа'),
  documentType: yup.string().required('Выберите вид документа').oneOf(['ID_CARD', 'PASSPORT']),
  pnOrIin: yup
    .string()
    .required('Номер обязателен')
    .test('valid-pn', 'Минимум 6 цифр', (value) => isValidPnOrIin(value || '')),
  phoneNumber: yup
    .string()
    .required('Номер обязателен')
    .test('valid-phone', 'Некорректный номер (минимум 10 цифр)', (value) => {
      const digits = normalizePhoneDigits(value || '')
      return digits.length >= 10
    }),
  email: yup
    .string()
    .required('Email обязателен')
    .test('is-gmail', 'Email должен быть @gmail.com', (value) => isValidGmail(value || '')),
  role: yup.string().required('Роль обязательна').oneOf(['expert', 'mentor', 'teacher', 'accountant']),
})

type FormData = yup.InferType<typeof schema>

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<{
    type: ConflictType
    data: EmployeeCreateResultDto['conflictUser']
    formData: FormData
  } | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      lastName: '',
      firstName: '',
      documentType: 'ID_CARD',
      pnOrIin: '',
      phoneNumber: '',
      email: '',
      role: 'mentor',
    },
  })

  const phoneValue = watch('phoneNumber')

  const handleClose = () => {
    reset()
    setConflict(null)
    onClose()
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload: EmployeeCreateRequest = {
        lastName: data.lastName,
        firstName: data.firstName,
        documentType: data.documentType as any,
        pnOrIin: data.pnOrIin,
        phoneNumber: normalizePhoneDigits(data.phoneNumber),
        email: data.email,
        role: data.role as any,
      }

      const result = await createEmployee(payload)

      if (result.type === 'CREATED') {
        enqueueSnackbar('Сотрудник добавлен', { variant: 'success' })
        handleClose()
        onSuccess()
      } else if (result.type === 'PHONE_TAKEN') {
        setConflict({
          type: 'PHONE_TAKEN',
          data: result.conflictUser!,
          formData: data,
        })
      } else if (result.type === 'EMAIL_TAKEN') {
        setConflict({
          type: 'EMAIL_TAKEN',
          data: result.conflictUser!,
          formData: data,
        })
      } else if (result.type === 'USER_EXISTS_NOT_EMPLOYEE') {
        setConflict({
          type: 'USER_EXISTS_NOT_EMPLOYEE',
          data: result.conflictUser!,
          formData: data,
        })
      } else if (result.type === 'EMPLOYEE_ALREADY_EXISTS') {
        setConflict({
          type: 'EMPLOYEE_ALREADY_EXISTS',
          data: result.conflictUser!,
          formData: data,
        })
      }
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при добавлении', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleConflictConfirm = async () => {
    if (!conflict) return

    setConflictLoading(true)
    try {
      if (conflict.type === 'PHONE_TAKEN') {
        const payload: EmployeeCreateRequest = {
          lastName: conflict.formData.lastName,
          firstName: conflict.formData.firstName,
          documentType: conflict.formData.documentType as any,
          pnOrIin: conflict.formData.pnOrIin,
          phoneNumber: normalizePhoneDigits(conflict.formData.phoneNumber),
          email: conflict.formData.email,
          role: conflict.formData.role as any,
        }
        await takePhoneAndCreate(conflict.data!.id, payload)
        enqueueSnackbar('Сотрудник добавлен, номер перенесен', { variant: 'success' })
        handleClose()
        onSuccess()
      } else if (conflict.type === 'USER_EXISTS_NOT_EMPLOYEE') {
        await addAsEmployee(conflict.data!.id, conflict.formData.role)
        enqueueSnackbar(
          'Пользователь добавлен как сотрудник, но номер телефона и почта не обновлены. Найдите этого пользователя в разделе Сотрудники и обновите номер телефона и почту вручную',
          { variant: 'info' }
        )
        handleClose()
        onSuccess()
      }
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при обработке', { variant: 'error' })
    } finally {
      setConflictLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open && !conflict} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить сотрудника</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Фамилия"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Имя"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <FormControl error={!!errors.documentType}>
              <FormLabel>Вид документа</FormLabel>
              <Controller
                name="documentType"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} sx={{ mt: 1 }}>
                    <FormControlLabel value="ID_CARD" control={<Radio />} label="Удостоверение личности" />
                    <FormControlLabel value="PASSPORT" control={<Radio />} label="Паспорт" />
                  </RadioGroup>
                )}
              />
            </FormControl>

            <Controller
              name="pnOrIin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Номер паспорта или ИИН"
                  error={!!errors.pnOrIin}
                  helperText={errors.pnOrIin?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="phoneNumber"
              control={control}
              render={({ field: { onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="WhatsApp номер"
                  placeholder="+7 700 123 45 67"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                  fullWidth
                  size="small"
                  value={phoneValue}
                  onChange={(e) => onChange(e.target.value)}
                  inputProps={{
                    inputMode: 'tel',
                  }}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Gmail"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role}>
                  <FormLabel>Роль</FormLabel>
                  <Select {...field} size="small" sx={{ mt: 1 }}>
                    <MenuItem value="mentor">Ментор</MenuItem>
                    <MenuItem value="teacher">Учитель</MenuItem>
                    <MenuItem value="expert">Эксперт</MenuItem>
                    <MenuItem value="accountant">Бухгалтер</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Отменить
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading} sx={{ position: 'relative' }}>
            {loading && <CircularProgress size={20} sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />}
            <span style={{ visibility: loading ? 'hidden' : 'visible' }}>Сохранить</span>
          </Button>
        </DialogActions>
      </Dialog>

      <ConflictModal
        open={!!conflict}
        conflictType={conflict?.type || null}
        conflictUser={conflict?.data}
        onClose={() => {
          setConflict(null)
          setConflictLoading(false)
        }}
        onConfirm={conflict && (conflict.type === 'PHONE_TAKEN' || conflict.type === 'USER_EXISTS_NOT_EMPLOYEE') ? handleConflictConfirm : undefined}
        confirmLabel={
          conflict?.type === 'PHONE_TAKEN'
            ? 'Отобрать номер телефона'
            : conflict?.type === 'USER_EXISTS_NOT_EMPLOYEE'
              ? 'Добавить как сотрудника'
              : 'Подтвердить'
        }
        loading={conflictLoading}
      />
    </>
  )
}
