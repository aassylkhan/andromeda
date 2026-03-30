import React, { useState, useEffect, useMemo } from 'react'
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
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { StudentDetail } from '../../entities/student/types'
import { getStudentParents, createPaymentRequest } from '../../entities/student/api'
import type { StudentParentLink } from '../../entities/student/types'
import { getExperts, getProductsDetail, getGrades, getLearningLanguages, getOffices, getLearningHourOptions } from '../../entities/lookup/api'
import type { LookupDto, ProductDetailDto } from '../../entities/lookup/types'

interface EnrollStudentDialogProps {
  open: boolean
  onClose: () => void
  student: StudentDetail
  onSuccess: () => void
}

export const EnrollStudentDialog: React.FC<EnrollStudentDialogProps> = ({ open, onClose, student, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar()

  const [experts, setExperts] = useState<LookupDto[]>([])
  const [parents, setParents] = useState<StudentParentLink[]>([])
  const [grades, setGrades] = useState<LookupDto[]>([])
  const [products, setProducts] = useState<ProductDetailDto[]>([])
  const [languages, setLanguages] = useState<LookupDto[]>([])
  const [offices, setOffices] = useState<LookupDto[]>([])
  const [hourOptions, setHourOptions] = useState<LookupDto[]>([])
  const [loadingLookups, setLoadingLookups] = useState(false)

  const [expertId, setExpertId] = useState<number | ''>('')
  const [parentId, setParentId] = useState<number | ''>('')
  const [gradeId, setGradeId] = useState<number | ''>('')
  const [productId, setProductId] = useState<number | ''>('')
  const [learningLanguageId, setLearningLanguageId] = useState<number | ''>('')
  const [officeId, setOfficeId] = useState<number | ''>('')
  const [learningHourOptionId, setLearningHourOptionId] = useState<number | ''>('')
  const [comments, setComments] = useState('')
  const [offgrStartDate, setOffgrStartDate] = useState('')
  const [freezings, setFreezings] = useState(0)
  const [classdays, setClassdays] = useState(0)
  const [membershipFee, setMembershipFee] = useState(0)
  const [courseFee, setCourseFee] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  const months = useMemo(() => {
    if (!selectedProduct?.amountOfClassdaysIn1m || selectedProduct.amountOfClassdaysIn1m === 0) return 0
    return Math.round((classdays / selectedProduct.amountOfClassdaysIn1m) * 100) / 100
  }, [classdays, selectedProduct])

  const hours = useMemo(() => {
    if (!selectedProduct?.amountOfHoursIn1cd) return 0
    return classdays * selectedProduct.amountOfHoursIn1cd
  }, [classdays, selectedProduct])

  const totalFee = membershipFee + courseFee

  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }, [])

  useEffect(() => {
    if (!open) return
    setLoadingLookups(true)
    Promise.all([
      getExperts(),
      getStudentParents(student.studentId),
      getGrades(),
      getProductsDetail(),
      getLearningLanguages(),
      getOffices(),
      getLearningHourOptions(),
    ])
      .then(([exp, par, gr, prod, lang, off, ho]) => {
        setExperts(exp)
        setParents(par)
        setGrades(gr)
        setProducts(prod)
        setLanguages(lang)
        setOffices(off)
        setHourOptions(ho)
      })
      .catch(() => enqueueSnackbar('Ошибка загрузки справочников', { variant: 'error' }))
      .finally(() => setLoadingLookups(false))
  }, [open, student.studentId, enqueueSnackbar])

  useEffect(() => {
    if (!open) {
      setExpertId('')
      setParentId('')
      setGradeId('')
      setProductId('')
      setLearningLanguageId('')
      setOfficeId('')
      setLearningHourOptionId('')
      setComments('')
      setOffgrStartDate('')
      setFreezings(0)
      setClassdays(0)
      setMembershipFee(0)
      setCourseFee(0)
    }
  }, [open])

  const handleSubmit = async () => {
    setConfirmOpen(false)
    if (!expertId || !parentId || !gradeId || !productId || !learningLanguageId || !officeId || !learningHourOptionId || !offgrStartDate) {
      enqueueSnackbar('Заполните все обязательные поля', { variant: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      await createPaymentRequest(student.studentId, {
        expertId: expertId as number,
        parentId: parentId as number,
        gradeId: gradeId as number,
        productId: productId as number,
        learningLanguageId: learningLanguageId as number,
        officeId: officeId as number,
        learningHourOptionId: learningHourOptionId as number,
        comments: comments || undefined,
        offgrStartDate,
        freezings,
        classdays,
        membershipFee,
        courseFee,
      })
      enqueueSnackbar('Запрос на оплату создан', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка создания запроса'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Записать на обучение</DialogTitle>
        <DialogContent>
          {loadingLookups ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField select label="Эксперт" value={expertId} onChange={(e) => setExpertId(Number(e.target.value))} fullWidth size="small">
                {experts.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </TextField>

              <TextField select label="Родитель" value={parentId} onChange={(e) => setParentId(Number(e.target.value))} fullWidth size="small">
                {parents.map((p) => <MenuItem key={p.parentId} value={p.parentId}>{p.fullName}</MenuItem>)}
              </TextField>

              <TextField select label="Класс" value={gradeId} onChange={(e) => setGradeId(Number(e.target.value))} fullWidth size="small">
                {grades.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </TextField>

              <TextField select label="Продукт" value={productId} onChange={(e) => setProductId(Number(e.target.value))} fullWidth size="small">
                {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>

              <TextField select label="Язык обучения" value={learningLanguageId} onChange={(e) => setLearningLanguageId(Number(e.target.value))} fullWidth size="small">
                {languages.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </TextField>

              <TextField select label="Филиал" value={officeId} onChange={(e) => setOfficeId(Number(e.target.value))} fullWidth size="small">
                {offices.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>

              <TextField select label="Время обучения" value={learningHourOptionId} onChange={(e) => setLearningHourOptionId(Number(e.target.value))} fullWidth size="small">
                {hourOptions.map((h) => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </TextField>

              <TextField
                label="Комментарии" value={comments} onChange={(e) => setComments(e.target.value)}
                fullWidth size="small" multiline minRows={3}
              />

              <TextField
                label="Дата начала обучения" type="date" value={offgrStartDate}
                onChange={(e) => setOffgrStartDate(e.target.value)}
                fullWidth size="small"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minDate } }}
              />

              <TextField
                label="Количество заморозочных дней" type="number" value={freezings}
                onChange={(e) => setFreezings(Number(e.target.value) || 0)}
                fullWidth size="small"
              />

              <TextField
                label="Количество учебных дней" type="number" value={classdays}
                onChange={(e) => setClassdays(Number(e.target.value) || 0)}
                fullWidth size="small"
              />

              <TextField label="Количество месяцев" value={months} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />
              <TextField label="Количество учебных часов" value={hours} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />

              <TextField
                label="Стоимость клубного взноса (₸)" type="number" value={membershipFee}
                onChange={(e) => setMembershipFee(Number(e.target.value) || 0)}
                fullWidth size="small"
              />

              <TextField
                label="Стоимость обучения (₸)" type="number" value={courseFee}
                onChange={(e) => setCourseFee(Number(e.target.value) || 0)}
                fullWidth size="small"
              />

              <TextField label="Итого к оплате (₸)" value={totalFee} fullWidth size="small" slotProps={{ input: { readOnly: true } }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отменить</Button>
          <Button variant="contained" disabled={submitting || loadingLookups} onClick={() => setConfirmOpen(true)}>
            {submitting ? <CircularProgress size={20} /> : 'Отправить бухгалтеру'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Вы уверены, что хотите отправить запрос на оплату бухгалтеру?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit}>Подтвердить</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
