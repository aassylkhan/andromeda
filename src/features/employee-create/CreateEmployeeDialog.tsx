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
} from '@mui/material'
import type { CreateEmployeeFormData } from './schema'
import { createEmployeeSchema } from './schema'

interface CreateEmployeeDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateEmployeeDialog({ open, onClose }: CreateEmployeeDialogProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(createEmployeeSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: undefined,
      phoneNumber: undefined,
      preferredLanguage: undefined,
    },
  })

  const onSubmit = (data: CreateEmployeeFormData | any) => {
    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      console.log('Create employee:', data)

      enqueueSnackbar('Сотрудник успешно добавлен', { variant: 'success' })
      reset()
      onClose()
    } catch (error) {
      enqueueSnackbar('Ошибка при добавлении сотрудника', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid rgba(145, 158, 171, 0.16)',
          boxShadow: '0 10px 40px rgba(245, 66, 100, 0.15)',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          fontWeight: 700, 
          fontSize: '1.75rem',
          pb: 2,
          background: 'linear-gradient(135deg, #F54264 0%, #F96741 45%, #FC8C1E 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Добавить сотрудника
      </DialogTitle>
      <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Controller
          name="firstName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Имя"
              fullWidth
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Фамилия"
              fullWidth
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              type="email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Телефон"
              fullWidth
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
            />
          )}
        />

        <Controller
          name="preferredLanguage"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Язык"
              select
              fullWidth
              error={!!errors.preferredLanguage}
              helperText={errors.preferredLanguage?.message}
            >
              <MenuItem value="ru">Русский</MenuItem>
              <MenuItem value="kz">Казахский</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </TextField>
          )}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          variant="outlined"
          sx={{ 
            px: 4,
            py: 1.5,
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: 'rgba(145, 158, 171, 0.16)',
            '&:hover': {
              borderWidth: '1px',
            },
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          sx={{ 
            px: 4,
            py: 1.5,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #F54264 0%, #F96741 45%, #FC8C1E 100%)',
            boxShadow: '0 4px 12px rgba(245, 66, 100, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #E03252 0%, #E85830 45%, #E67A17 100%)',
              boxShadow: '0 8px 20px rgba(245, 66, 100, 0.4)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
            },
          }}
        >
          {isSubmitting ? 'Добавление...' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
