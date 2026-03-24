import { useState, useEffect } from 'react'
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
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { updateUserDocument } from '../../entities/user/api'
import type { UserDto } from '../../entities/user/types'
import type { DocumentType } from '../../shared/utils/documentUtils'

interface EditDocumentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: UserDto | null
}

export function EditDocumentModal({ open, onClose, onSuccess, user }: EditDocumentModalProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState(false)

  const [docType, setDocType] = useState<DocumentType>('ID_CARD')
  const [docNumber, setDocNumber] = useState('')

  useEffect(() => {
    if (user && open) {
      const dt = (user.documentType as DocumentType) ?? 'ID_CARD'
      setDocType(dt)
      setDocNumber(user.documentNumber ?? '')
      setInputError(false)
    }
  }, [user, open])

  if (!user) return null

  if (open && user.documentType === 'ID_CARD' && user.documentNumber) {
    return (
      <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Нельзя редактировать номер документа если документ это Удостоверение личности РК
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const handleSave = async () => {
    if (docType === 'ID_CARD' && !/^\d{12}$/.test(docNumber)) {
      setInputError(true)
      return
    }
    if (docType === 'PASSPORT' && (!docNumber.trim() || /\s/.test(docNumber))) {
      setInputError(true)
      return
    }
    setInputError(false)

    setLoading(true)
    try {
      await updateUserDocument(user.id, { documentType: docType, documentNumber: docNumber })
      enqueueSnackbar('Документ обновлен', { variant: 'success' })
      onClose()
      onSuccess()
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Ошибка')
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать номер документа</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl>
            <FormLabel>Вид документа *</FormLabel>
            <RadioGroup
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value as DocumentType)
                setDocNumber('')
                setInputError(false)
              }}
              row
              sx={{ mt: 1 }}
            >
              <FormControlLabel value="ID_CARD" control={<Radio />} label="Удостоверение личности РК" />
              <FormControlLabel value="PASSPORT" control={<Radio />} label="Паспорт" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Номер документа *"
            value={docNumber}
            onChange={(e) => {
              let val = e.target.value
              if (docType === 'ID_CARD') {
                val = val.replace(/\D/g, '').slice(0, 12)
              } else {
                val = val.replace(/\s/g, '')
              }
              setDocNumber(val)
              setInputError(false)
            }}
            error={inputError}
            helperText={
              inputError
                ? docType === 'ID_CARD'
                  ? 'ИИН должен содержать ровно 12 цифр'
                  : 'Номер паспорта не должен содержать пробелов'
                : docType === 'ID_CARD'
                  ? 'Только цифры, 12 символов'
                  : 'Без пробелов'
            }
            fullWidth
            inputProps={{
              inputMode: docType === 'ID_CARD' ? 'numeric' : 'text',
              maxLength: docType === 'ID_CARD' ? 12 : undefined,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отменить
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
