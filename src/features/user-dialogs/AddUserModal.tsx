import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  CircularProgress,
  InputAdornment,
  Typography,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { createUser, confirmCreateUser } from '../../entities/user/api'
import type { CreateUserRequest, UserDto } from '../../entities/user/types'
import { buildPnOrIin } from '../../shared/utils/documentUtils'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import type { DocumentType } from '../../shared/utils/documentUtils'
import { normalizePhoneDigits } from '../../shared/utils/phoneUtils'

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const schema = yup.object().shape({
  lastName: yup.string().required('Фамилия обязательна'),
  firstName: yup.string().required('Имя обязательно'),
  documentType: yup.string().required('Выберите вид документа').oneOf(['ID_CARD', 'PASSPORT']),
  documentNumber: yup.string().required('Номер документа обязателен'),
  phoneNumber: yup.string().required('Номер телефона обязателен'),
})

type FormData = yup.InferType<typeof schema>

type ConflictState =
  | null
  | { type: 'DOCUMENT_CONFLICT'; message: string }
  | { type: 'PHONE_CONFLICT'; existingUser: UserDto; newUserData: FormData }

export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<ConflictState>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      lastName: '',
      firstName: '',
      documentType: 'ID_CARD',
      documentNumber: '',
      phoneNumber: '',
    },
  })

  const docType = watch('documentType') as DocumentType

  const handleClose = () => {
    reset()
    setConflict(null)
    onClose()
  }

  const validateDocument = (data: FormData): boolean => {
    if (data.documentType === 'ID_CARD') {
      if (!/^\d{12}$/.test(data.documentNumber)) {
        setError('documentNumber', { message: 'ИИН должен содержать ровно 12 цифр' })
        return false
      }
    } else {
      if (/\s/.test(data.documentNumber)) {
        setError('documentNumber', { message: 'Номер паспорта не должен содержать пробелов' })
        return false
      }
      if (!data.documentNumber.trim()) {
        setError('documentNumber', { message: 'Номер документа обязателен' })
        return false
      }
    }
    return true
  }

  const onSubmit = async (data: FormData) => {
    if (!validateDocument(data)) return

    const phoneDigits = normalizePhoneDigits(data.phoneNumber)
    if (phoneDigits.length < 10) {
      setError('phoneNumber', { message: 'Минимум 10 цифр' })
      return
    }

    setLoading(true)
    try {
      const payload: CreateUserRequest = {
        lastName: data.lastName,
        firstName: data.firstName,
        pnOrIin: buildPnOrIin(data.documentType as DocumentType, data.documentNumber),
        phoneNumber: `+${phoneDigits}`,
      }

      const result = await createUser(payload)

      if (result.type === 'CREATED') {
        enqueueSnackbar('Пользователь добавлен', { variant: 'success' })
        handleClose()
        onSuccess()
      } else if (result.type === 'DOCUMENT_CONFLICT') {
        setConflict({ type: 'DOCUMENT_CONFLICT', message: result.message || 'Пользователь с таким номером документа уже существует' })
      } else if (result.type === 'PHONE_CONFLICT' && result.existingUser) {
        setConflict({ type: 'PHONE_CONFLICT', existingUser: result.existingUser, newUserData: data })
      }
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка при создании', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneConflictConfirm = async () => {
    if (conflict?.type !== 'PHONE_CONFLICT') return

    setConfirmLoading(true)
    try {
      const data = conflict.newUserData
      const phoneDigits = normalizePhoneDigits(data.phoneNumber)
      await confirmCreateUser({
        lastName: data.lastName,
        firstName: data.firstName,
        pnOrIin: buildPnOrIin(data.documentType as DocumentType, data.documentNumber),
        phoneNumber: `+${phoneDigits}`,
      })
      enqueueSnackbar('Пользователь добавлен', { variant: 'success' })
      handleClose()
      onSuccess()
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Ошибка', { variant: 'error' })
    } finally {
      setConfirmLoading(false)
    }
  }

  // --- Document conflict modal ---
  if (conflict?.type === 'DOCUMENT_CONFLICT') {
    return (
      <Dialog open onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {conflict.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // --- Phone conflict modal ---
  if (conflict?.type === 'PHONE_CONFLICT') {
    const existing = conflict.existingUser
    const nd = conflict.newUserData
    return (
      <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Пользователь с таким номером телефона уже существует</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Существующий пользователь:
              </Typography>
              <Typography variant="body2">ID: {existing.id}</Typography>
              <Typography variant="body2">ФИО: {existing.lastName} {existing.firstName}</Typography>
              <Typography variant="body2">Документ: {existing.pnOrIin || '—'}</Typography>
              <Typography variant="body2">Телефон: {existing.phoneNumber ? formatPhoneForUi(existing.phoneNumber) : '—'}</Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Новый пользователь:
              </Typography>
              <Typography variant="body2">ФИО: {nd.lastName} {nd.firstName}</Typography>
              <Typography variant="body2">
                Документ: {buildPnOrIin(nd.documentType as DocumentType, nd.documentNumber)}
              </Typography>
              <Typography variant="body2">Телефон: +{normalizePhoneDigits(nd.phoneNumber)}</Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Проверьте корректно ли вы ввели данные нового пользователя
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={confirmLoading}>
            Нет, ввести заново
          </Button>
          <Button variant="contained" onClick={handlePhoneConflictConfirm} disabled={confirmLoading}>
            {confirmLoading ? <CircularProgress size={20} /> : 'Да, я все ввел корректно'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // --- Main add form ---
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить пользователя</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Фамилия *"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Имя *"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                fullWidth
              />
            )}
          />

          <FormControl error={!!errors.documentType}>
            <FormLabel>Вид документа *</FormLabel>
            <Controller
              name="documentType"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row sx={{ mt: 1 }}>
                  <FormControlLabel value="ID_CARD" control={<Radio />} label="Удостоверение личности РК" />
                  <FormControlLabel value="PASSPORT" control={<Radio />} label="Паспорт" />
                </RadioGroup>
              )}
            />
          </FormControl>

          <Controller
            name="documentNumber"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                label="Номер документа *"
                value={value}
                onChange={(e) => {
                  let val = e.target.value
                  if (docType === 'ID_CARD') {
                    val = val.replace(/\D/g, '').slice(0, 12)
                  } else {
                    val = val.replace(/\s/g, '')
                  }
                  onChange(val)
                }}
                error={!!errors.documentNumber}
                helperText={
                  errors.documentNumber?.message ||
                  (docType === 'ID_CARD' ? 'Только цифры, 12 символов' : 'Без пробелов')
                }
                fullWidth
                inputProps={{
                  inputMode: docType === 'ID_CARD' ? 'numeric' : 'text',
                  maxLength: docType === 'ID_CARD' ? 12 : undefined,
                }}
              />
            )}
          />

          <Controller
            name="phoneNumber"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                label="Номер телефона *"
                placeholder="7XXXXXXXXXX"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
                fullWidth
                inputProps={{ inputMode: 'tel' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>+</Typography>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Отменить
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
