import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined'
import { useSnackbar } from 'notistack'
import {
  getReferralInfo,
  getReferralPayouts,
  createReferralPayout,
} from '../../entities/referral'
import type {
  RpInfoResponse,
  PayoutRequestItem,
  ReferredClientItem,
} from '../../entities/referral'

const fmt = (d: string) => {
  const dt = new Date(d)
  return dt.toLocaleDateString('ru-RU') + ', ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const formatBankDetails = (bd: string) => {
  if (bd.startsWith('card_')) return '*' + bd.slice(-4)
  if (bd.startsWith('kaspi_')) return bd.replace('kaspi_', '')
  return bd
}

type Tab = 'info' | 'payouts'

export default function ReferralProgramPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [rpInfo, setRpInfo] = useState<RpInfoResponse | null>(null)
  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([])
  const [payoutsLoaded, setPayoutsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [payoutOpen, setPayoutOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'kaspi' | 'card'>('kaspi')
  const [payoutDetails, setPayoutDetails] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)

  const loadInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReferralInfo()
      setRpInfo(data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка загрузки'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPayouts = useCallback(async () => {
    try {
      const data = await getReferralPayouts()
      setPayouts(data)
      setPayoutsLoaded(true)
    } catch {
      enqueueSnackbar('Ошибка загрузки заявок на вывод', { variant: 'error' })
    }
  }, [enqueueSnackbar])

  useEffect(() => {
    void loadInfo()
  }, [loadInfo])

  useEffect(() => {
    if (tab === 'payouts' && !payoutsLoaded) {
      void loadPayouts()
    }
  }, [tab, payoutsLoaded, loadPayouts])

  const handleCopyLink = () => {
    if (rpInfo?.link) {
      void navigator.clipboard.writeText('https://' + rpInfo.link)
      enqueueSnackbar('Ссылка скопирована', { variant: 'success' })
    }
  }

  const amountNum = Number(payoutAmount) || 0
  const isAmountOver = rpInfo ? amountNum > rpInfo.rpBalance : false
  const detailsDigits = payoutDetails.replace(/\D/g, '')
  const isDetailsValid = payoutMethod === 'kaspi' ? detailsDigits.length === 11 : detailsDigits.length === 16
  const canSubmitPayout = amountNum > 0 && !isAmountOver && isDetailsValid

  const handlePayoutSubmit = async () => {
    setConfirmOpen(false)
    setPayoutLoading(true)
    try {
      await createReferralPayout({
        amount: amountNum,
        method: payoutMethod,
        details: detailsDigits,
      })
      enqueueSnackbar('Заявка на вывод создана', { variant: 'success' })
      setPayoutOpen(false)
      setPayoutAmount('')
      setPayoutDetails('')
      setPayoutsLoaded(false)
      void loadInfo()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  }

  if (!rpInfo) return null

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Реферальная программа
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip
          label="Информация"
          color={tab === 'info' ? 'primary' : 'default'}
          onClick={() => setTab('info')}
          variant={tab === 'info' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Вывод средств"
          color={tab === 'payouts' ? 'primary' : 'default'}
          onClick={() => setTab('payouts')}
          variant={tab === 'payouts' ? 'filled' : 'outlined'}
        />
      </Stack>

      {tab === 'info' && (
        <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Моя ссылка</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', flex: 1 }}>
                  https://{rpInfo.link}
                </Typography>
                <Tooltip title="Копировать">
                  <IconButton size="small" onClick={handleCopyLink}>
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Мой реферальный счёт</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {rpInfo.rpBalance.toLocaleString('ru-RU')} ₸
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Мой уровень</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {(rpInfo.referrerRate * 100).toFixed(0)}%
              </Typography>
            </Paper>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setTab('payouts')}>
              Вывод средств
            </Button>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Мои клиенты
          </Typography>

          {rpInfo.referredClients.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <CardGiftcardOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Пока нет приглашённых клиентов</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата и время</TableCell>
                    <TableCell>Имя</TableCell>
                    <TableCell>Номер</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Оплатил</TableCell>
                    <TableCell align="right">Ваше вознаграждение</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rpInfo.referredClients.map((c: ReferredClientItem) => (
                    <TableRow key={c.id}>
                      <TableCell>{fmt(c.createdAt)}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.phoneNumber}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.status}
                          color={c.status === 'Оставил заявку' ? 'info' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{c.paidAmount != null ? `${c.paidAmount.toLocaleString('ru-RU')} ₸` : '—'}</TableCell>
                      <TableCell align="right">{c.referrersShare != null ? `${c.referrersShare.toLocaleString('ru-RU')} ₸` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 'payouts' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setPayoutOpen(true)}>
              Вывести средства
            </Button>
          </Box>

          {payouts.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography color="text.secondary">Нет заявок на вывод</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата и время</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                    <TableCell>Реквизиты</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Переведено</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmt(p.createdAt)}</TableCell>
                      <TableCell align="right">{p.amount.toLocaleString('ru-RU')} ₸</TableCell>
                      <TableCell>{formatBankDetails(p.bankDetails)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.status}
                          color={p.status === 'Переведено' ? 'success' : p.status === 'Отклонено' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{p.payoutTime ? fmt(p.payoutTime) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Payout Request Modal */}
      <Dialog open={payoutOpen} onClose={() => setPayoutOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Запрос</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Сумма"
              type="number"
              fullWidth
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              error={isAmountOver}
              helperText={isAmountOver ? `Недостаточно средств (доступно ${rpInfo.rpBalance.toLocaleString('ru-RU')} ₸)` : ''}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <RadioGroup value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as 'kaspi' | 'card')}>
              <FormControlLabel value="kaspi" control={<Radio />} label="Каспи перевод" />
              <FormControlLabel value="card" control={<Radio />} label="На карту" />
            </RadioGroup>
            <TextField
              label={payoutMethod === 'kaspi' ? 'Номер телефона (11 цифр, через 8)' : 'Номер карты (16 цифр)'}
              fullWidth
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value.replace(/\D/g, ''))}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: payoutMethod === 'kaspi' ? 11 : 16 } }}
              error={payoutDetails.length > 0 && !isDetailsValid}
              helperText={payoutDetails.length > 0 && !isDetailsValid
                ? (payoutMethod === 'kaspi' ? 'Введите 11 цифр' : 'Введите 16 цифр')
                : ''
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayoutOpen(false)}>Отменить</Button>
          <Button
            variant="contained"
            disabled={!canSubmitPayout || payoutLoading}
            onClick={() => setConfirmOpen(true)}
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Вы уверены, что хотите вывести {amountNum.toLocaleString('ru-RU')} ₸?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handlePayoutSubmit} disabled={payoutLoading}>
            {payoutLoading ? <CircularProgress size={20} /> : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
