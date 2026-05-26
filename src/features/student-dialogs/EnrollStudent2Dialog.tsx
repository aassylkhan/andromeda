import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { StudentDetail, StudentParentLink } from '../../entities/student/types'
import { getStudentParents } from '../../entities/student/api'
import {
  getExperts,
  getGrades,
  getLearningHourOptions,
  getLearningLanguages,
  getOffices,
  getProductsDetail,
} from '../../entities/lookup/api'
import type { LookupDto, ProductDetailDto } from '../../entities/lookup/types'
import { createPaymentRequest2 } from '../../entities/payment-request-2/api'
import { getBlockedDates } from '../../entities/forbidden-date/api'

/**
 * TZ-11: «Записать на обучение 2». A parallel enrollment flow that splits the
 * learning fee into a first-month / remaining-months breakdown. Autocalculated
 * values are rendered as plain text (per spec), not as disabled inputs.
 */
interface EnrollStudent2DialogProps {
  open: boolean
  onClose: () => void
  student: StudentDetail
  onSuccess: () => void
}

const formatMoney = (value: number) =>
  value.toLocaleString('ru-KZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + ' ₸'

const SummaryRow: React.FC<{ label: string; value: React.ReactNode; emphasis?: boolean }> = ({
  label,
  value,
  emphasis,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 2,
      py: 0.5,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: emphasis ? 700 : 500, textAlign: 'right' }}>
      {value}
    </Typography>
  </Box>
)

const SummaryCard: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Box
    sx={{
      bgcolor: '#F5F7FA',
      borderRadius: 1.5,
      px: 2,
      py: 1.5,
      border: '1px solid rgba(145,158,171,0.16)',
    }}
  >
    {title && (
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
    )}
    {children}
  </Box>
)

export const EnrollStudent2Dialog: React.FC<EnrollStudent2DialogProps> = ({
  open,
  onClose,
  student,
  onSuccess,
}) => {
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
  const [offerStartDate, setOfferStartDate] = useState('')
  const [freezings, setFreezings] = useState<number | ''>('')
  const [classdays, setClassdays] = useState<number | ''>('')
  const [fee, setFee] = useState<number | ''>('')

  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [forbiddenDates, setForbiddenDates] = useState<Set<string>>(new Set())
  const [dateForbiddenError, setDateForbiddenError] = useState<string | null>(null)

  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }, [])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  // ----- live calculations (frontend preview; backend recomputes on save) -----

  const cdValue = typeof classdays === 'number' ? classdays : 0
  const feeValue = typeof fee === 'number' ? fee : 0
  const cdIn1m = selectedProduct?.amountOfClassdaysIn1m ?? 0
  const hrsIn1cd = selectedProduct?.amountOfHoursIn1cd ?? 0

  const computed = useMemo(() => {
    if (cdValue <= 0 || cdIn1m <= 0 || hrsIn1cd <= 0) {
      return {
        ready: false as const,
        months: 0,
        hours: 0,
        firstMonthHours: 0,
        firstMonthFee: 0,
        remainingMonthsHours: 0,
        remainingMonthsFee: 0,
      }
    }
    const months = Math.round((cdValue / cdIn1m) * 100) / 100
    const hours = cdValue * hrsIn1cd
    let firstMonthHours: number
    let firstMonthFee: number
    if (cdValue < cdIn1m) {
      firstMonthHours = cdValue * hrsIn1cd
      firstMonthFee = feeValue
    } else {
      firstMonthHours = cdIn1m * hrsIn1cd
      const denom = firstMonthHours + hours
      firstMonthFee =
        denom > 0
          ? Math.round(((feeValue * firstMonthHours * 2) / denom) * 100) / 100
          : 0
    }
    const remainingMonthsHours = hours - firstMonthHours
    const remainingMonthsFee = Math.round((feeValue - firstMonthFee) * 100) / 100
    return {
      ready: true as const,
      months,
      hours,
      firstMonthHours,
      firstMonthFee,
      remainingMonthsHours,
      remainingMonthsFee,
    }
  }, [cdValue, cdIn1m, hrsIn1cd, feeValue])

  // ----- lookups load -----

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
      getBlockedDates(),
    ])
      .then(([exp, par, gr, prod, lang, off, ho, blocked]) => {
        setExperts(exp)
        setParents(par)
        setGrades(gr)
        setProducts(prod)
        setLanguages(lang)
        setOffices(off)
        setHourOptions(ho)
        setForbiddenDates(new Set(blocked))
      })
      .catch(() => enqueueSnackbar('Ошибка загрузки справочников', { variant: 'error' }))
      .finally(() => setLoadingLookups(false))
  }, [open, student.studentId, enqueueSnackbar])

  // ----- reset on close -----

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
      setOfferStartDate('')
      setFreezings('')
      setClassdays('')
      setFee('')
      setSubmitting(false)
      setConfirmOpen(false)
      setForbiddenDates(new Set())
      setDateForbiddenError(null)
    }
  }, [open])

  const handleOfferStartDateChange = (value: string) => {
    setOfferStartDate(value)
    if (value && forbiddenDates.has(value)) {
      setDateForbiddenError('Эта дата недоступна для начала обучения')
    } else {
      setDateForbiddenError(null)
    }
  }

  const numberFromInput = (val: string): number | '' => {
    if (val === '') return ''
    const n = Number(val)
    return Number.isFinite(n) ? n : ''
  }

  const isValid =
    !!expertId &&
    !!parentId &&
    !!gradeId &&
    !!productId &&
    !!learningLanguageId &&
    !!officeId &&
    !!learningHourOptionId &&
    !!offerStartDate &&
    !dateForbiddenError &&
    !forbiddenDates.has(offerStartDate) &&
    typeof classdays === 'number' &&
    classdays > 0 &&
    typeof freezings === 'number' &&
    freezings >= 0 &&
    typeof fee === 'number' &&
    fee >= 0 &&
    computed.ready

  const handleAttemptSubmit = () => {
    if (!isValid) {
      enqueueSnackbar('Заполните все обязательные поля корректно', { variant: 'warning' })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!isValid) return
    setConfirmOpen(false)
    setSubmitting(true)
    try {
      await createPaymentRequest2(student.studentId, {
        expertId: expertId as number,
        parentId: parentId as number,
        gradeId: gradeId as number,
        productId: productId as number,
        learningLanguageId: learningLanguageId as number,
        officeId: officeId as number,
        learningHourOptionId: learningHourOptionId as number,
        comments: comments.trim() || undefined,
        offerStartDate,
        freezings: freezings as number,
        classdays: classdays as number,
        fee: fee as number,
      })
      enqueueSnackbar('Запрос на оплату отправлен бухгалтеру', { variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при создании запроса'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Записать на обучение 2</DialogTitle>
        <DialogContent>
          {loadingLookups ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Stack sx={{ mt: 1 }} spacing={2}>
              <TextField
                select
                label="Эксперт"
                value={expertId}
                onChange={(e) => setExpertId(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {experts.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Родитель"
                value={parentId}
                onChange={(e) => setParentId(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {parents.length === 0 && (
                  <MenuItem value="" disabled>
                    Нет привязанных родителей
                  </MenuItem>
                )}
                {parents.map((p) => (
                  <MenuItem key={p.parentId} value={p.parentId}>
                    {p.fullName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Класс"
                value={gradeId}
                onChange={(e) => setGradeId(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {grades.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
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
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
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
              >
                {languages.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
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
              >
                {offices.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Время обучения"
                value={learningHourOptionId}
                onChange={(e) => setLearningHourOptionId(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {hourOptions.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Комментарии"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
              />

              <TextField
                label="Дата начала обучения"
                type="date"
                value={offerStartDate}
                onChange={(e) => handleOfferStartDateChange(e.target.value)}
                fullWidth
                size="small"
                required
                error={!!dateForbiddenError}
                helperText={dateForbiddenError ?? 'Не раньше послезавтра; недоступные даты запрещены'}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minDate } }}
              />

              <TextField
                label="Количество заморозочных дней"
                type="number"
                value={freezings}
                onChange={(e) => {
                  const v = numberFromInput(e.target.value)
                  if (v === '' || (typeof v === 'number' && v >= 0)) {
                    setFreezings(v === '' ? '' : Math.floor(v))
                  }
                }}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
              />

              <TextField
                label="Количество учебных дней"
                type="number"
                value={classdays}
                onChange={(e) => {
                  const v = numberFromInput(e.target.value)
                  if (v === '' || (typeof v === 'number' && v >= 0)) {
                    setClassdays(v === '' ? '' : Math.floor(v))
                  }
                }}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
              />

              <SummaryCard>
                <SummaryRow
                  label="Количество месяцев"
                  value={computed.ready ? computed.months.toString() : '—'}
                />
                <SummaryRow
                  label="Количество учебных часов"
                  value={computed.ready ? computed.hours.toString() : '—'}
                />
              </SummaryCard>

              <TextField
                label="Стоимость"
                type="number"
                value={fee}
                onChange={(e) => {
                  const v = numberFromInput(e.target.value)
                  if (v === '' || (typeof v === 'number' && v >= 0)) {
                    setFee(v)
                  }
                }}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'decimal' } }}
              />

              <SummaryCard title="Первый месяц">
                <SummaryRow
                  label="Количество часов"
                  value={computed.ready ? computed.firstMonthHours.toString() : '—'}
                />
                <SummaryRow
                  label="Стоимость"
                  value={computed.ready ? formatMoney(computed.firstMonthFee) : '—'}
                  emphasis
                />
              </SummaryCard>

              <SummaryCard title="Остальные месяцы">
                <SummaryRow
                  label="Количество часов"
                  value={computed.ready ? computed.remainingMonthsHours.toString() : '—'}
                />
                <SummaryRow
                  label="Стоимость"
                  value={computed.ready ? formatMoney(computed.remainingMonthsFee) : '—'}
                  emphasis
                />
              </SummaryCard>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Отменить
          </Button>
          <Button
            variant="contained"
            onClick={handleAttemptSubmit}
            disabled={submitting || loadingLookups || !isValid}
          >
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
