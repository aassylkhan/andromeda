import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { StudentDetail } from '../../entities/student/types'
import { updateStudentAcademicInfo } from '../../entities/student/api'
import {
  getGrades,
  getLearningHourOptions,
  getLearningLanguages,
  getOffices,
  getProductsDetail,
} from '../../entities/lookup/api'
import type { LookupDto, ProductDetailDto } from '../../entities/lookup/types'

interface EditStudentDialogProps {
  open: boolean
  onClose: () => void
  student: StudentDetail
  onSuccess: () => void
}

export const EditStudentDialog: React.FC<EditStudentDialogProps> = ({
  open,
  onClose,
  student,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [grades, setGrades] = useState<LookupDto[]>([])
  const [products, setProducts] = useState<ProductDetailDto[]>([])
  const [languages, setLanguages] = useState<LookupDto[]>([])
  const [offices, setOffices] = useState<LookupDto[]>([])
  const [hourOptions, setHourOptions] = useState<LookupDto[]>([])
  const [loadingLookups, setLoadingLookups] = useState(false)

  const [gradeId, setGradeId] = useState<number | ''>('')
  const [productId, setProductId] = useState<number | ''>('')
  const [learningLanguageId, setLearningLanguageId] = useState<number | ''>('')
  const [officeId, setOfficeId] = useState<number | ''>('')
  const [learningHourOptionId, setLearningHourOptionId] = useState<number | ''>('')
  const [offerStartDate, setOfferStartDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingLookups(true)
    Promise.all([
      getGrades(),
      getProductsDetail(),
      getLearningLanguages(),
      getOffices(),
      getLearningHourOptions(),
    ])
      .then(([gr, prod, lang, off, ho]) => {
        setGrades(gr)
        setProducts(prod)
        setLanguages(lang)
        setOffices(off)
        setHourOptions(ho)
      })
      .catch(() => enqueueSnackbar('Ошибка загрузки справочников', { variant: 'error' }))
      .finally(() => setLoadingLookups(false))
  }, [open, enqueueSnackbar])

  useEffect(() => {
    if (!open) return
    setGradeId(student.gradeId ?? '')
    setProductId(student.productId ?? '')
    setLearningLanguageId(student.learningLanguageId ?? '')
    setOfficeId(student.officeId ?? '')
    setLearningHourOptionId(student.learningHourOptionId ?? '')
    setOfferStartDate(student.offerStartDate ?? '')
  }, [open, student])

  const handleSave = async () => {
    if (
      !gradeId ||
      !productId ||
      !learningLanguageId ||
      !officeId ||
      !learningHourOptionId ||
      !offerStartDate
    ) {
      enqueueSnackbar('Заполните все обязательные поля', { variant: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      await updateStudentAcademicInfo(student.studentId, {
        gradeId: gradeId as number,
        productId: productId as number,
        learningLanguageId: learningLanguageId as number,
        officeId: officeId as number,
        learningHourOptionId: learningHourOptionId as number,
        offerStartDate,
      })
      enqueueSnackbar('Параметры ученика сохранены', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка сохранения'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать ученика</DialogTitle>
      <DialogContent>
        {loadingLookups ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Класс"
              value={gradeId}
              onChange={(e) => setGradeId(Number(e.target.value))}
              fullWidth
              size="small"
              required
            >
              {grades.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Язык обучения"
              value={learningLanguageId}
              onChange={(e) => setLearningLanguageId(Number(e.target.value))}
              fullWidth
              size="small"
              required
            >
              {languages.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Продукт"
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              fullWidth
              size="small"
              required
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Филиал"
              value={officeId}
              onChange={(e) => setOfficeId(Number(e.target.value))}
              fullWidth
              size="small"
              required
            >
              {offices.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Время"
              value={learningHourOptionId}
              onChange={(e) => setLearningHourOptionId(Number(e.target.value))}
              fullWidth
              size="small"
              required
            >
              {hourOptions.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Дата старта"
              type="date"
              value={offerStartDate}
              onChange={(e) => setOfferStartDate(e.target.value)}
              fullWidth
              size="small"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Отменить
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitting || loadingLookups}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
