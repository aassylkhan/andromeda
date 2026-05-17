import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
import { AppShell } from '../components/AppShell'
import {
  appGetReferralInfo,
  appGetPayouts,
  appCreatePayout,
} from '../api/appReferralApi'
import type { AppRpInfo, AppPayoutRequest } from '../api/appReferralApi'

const fmt = (d: string) => {
  const dt = new Date(d)
  return dt.toLocaleDateString('ru-RU') + ', ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const formatBankDetails = (bd: string) => {
  if (bd.startsWith('card_')) return '*' + bd.slice(-4)
  if (bd.startsWith('kaspi_')) return bd.replace('kaspi_', '')
  return bd
}

interface AppReferralPageProps {
  backPath: string
}

export const AppReferralPage: React.FC<AppReferralPageProps> = ({ backPath }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rpInfo, setRpInfo] = useState<AppRpInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showPayouts, setShowPayouts] = useState(false)
  const [payouts, setPayouts] = useState<AppPayoutRequest[]>([])
  const [payoutsLoaded, setPayoutsLoaded] = useState(false)

  const [payoutOpen, setPayoutOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'kaspi' | 'card'>('kaspi')
  const [payoutDetails, setPayoutDetails] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await appGetReferralInfo()
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
      const data = await appGetPayouts()
      setPayouts(data)
      setPayoutsLoaded(true)
    } catch {
      setError('Ошибка загрузки заявок')
    }
  }, [])

  useEffect(() => {
    void loadInfo()
  }, [loadInfo])

  useEffect(() => {
    if (showPayouts && !payoutsLoaded) {
      void loadPayouts()
    }
  }, [showPayouts, payoutsLoaded, loadPayouts])

  const handleCopyLink = () => {
    if (rpInfo?.link) {
      void navigator.clipboard.writeText('https://' + rpInfo.link)
      setSuccessMsg('Ссылка скопирована!')
      setTimeout(() => setSuccessMsg(null), 2000)
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
      await appCreatePayout({
        amount: amountNum,
        method: payoutMethod,
        details: detailsDigits,
      })
      setSuccessMsg('Заявка на вывод создана!')
      setTimeout(() => setSuccessMsg(null), 3000)
      setPayoutOpen(false)
      setPayoutAmount('')
      setPayoutDetails('')
      setPayoutsLoaded(false)
      void loadInfo()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      setError(msg)
    } finally {
      setPayoutLoading(false)
    }
  }

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1.5,
            borderBottom: '1px solid rgba(145,158,171,0.16)',
            bgcolor: '#FFFFFF',
          }}
        >
          <IconButton
            aria-label="Назад"
            onClick={() => {
              if (showPayouts) {
                setShowPayouts(false)
              } else {
                navigate(backPath, { replace: true })
              }
            }}
            sx={{ color: '#637381' }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {showPayouts ? 'Вывод средств' : 'Реферальная программа'}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#FFFFFF' }}>
          {successMsg && <Alert severity="success">{successMsg}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !rpInfo ? null : !showPayouts ? (
            <>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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

              <Stack direction="row" spacing={1.5}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Баланс</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {rpInfo.rpBalance.toLocaleString('ru-RU')} ₸
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Уровень</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {(rpInfo.referrerRate * 100).toFixed(0)}%
                  </Typography>
                </Paper>
              </Stack>

              <Button variant="contained" onClick={() => setShowPayouts(true)} sx={{ minHeight: 44 }}>
                Вывод средств
              </Button>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                Мои клиенты
              </Typography>

              {rpInfo.referredClients.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <CardGiftcardRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Пока нет приглашённых клиентов
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {rpInfo.referredClients.map((c) => (
                    <Paper key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                        <Chip
                          size="small"
                          label={c.status}
                          color={c.status === 'Оставил заявку' ? 'info' : 'default'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{c.phoneNumber}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>{fmt(c.createdAt)}</Typography>
                      {(c.paidAmount != null || c.referrersShare != null) && (
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 2 }}>
                          {c.paidAmount != null && <Typography variant="caption">Оплатил: {c.paidAmount.toLocaleString('ru-RU')} ₸</Typography>}
                          {c.referrersShare != null && <Typography variant="caption" color="primary">Вознаграждение: {c.referrersShare.toLocaleString('ru-RU')} ₸</Typography>}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </>
          ) : (
            <>
              <Button variant="contained" onClick={() => setPayoutOpen(true)} sx={{ minHeight: 44 }}>
                Вывести средства
              </Button>

              {payouts.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Нет заявок на вывод</Typography>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {payouts.map((p) => (
                    <Paper key={p.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.amount.toLocaleString('ru-RU')} ₸
                        </Typography>
                        <Chip
                          size="small"
                          label={p.status}
                          color={p.status === 'Переведено' ? 'success' : p.status === 'Отклонено' ? 'error' : 'warning'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatBankDetails(p.bankDetails)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        {fmt(p.createdAt)}
                      </Typography>
                      {p.payoutTime && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Переведено: {fmt(p.payoutTime)}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>

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
              helperText={isAmountOver ? `Доступно ${rpInfo?.rpBalance.toLocaleString('ru-RU')} ₸` : ''}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <RadioGroup value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as 'kaspi' | 'card')}>
              <FormControlLabel value="kaspi" control={<Radio />} label="Каспи перевод" />
              <FormControlLabel value="card" control={<Radio />} label="На карту" />
            </RadioGroup>
            <TextField
              label={payoutMethod === 'kaspi' ? 'Номер телефона (через 8)' : 'Номер карты (16 цифр)'}
              fullWidth
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value.replace(/\D/g, ''))}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: payoutMethod === 'kaspi' ? 11 : 16 } }}
              error={payoutDetails.length > 0 && !isDetailsValid}
              helperText={payoutDetails.length > 0 && !isDetailsValid
                ? (payoutMethod === 'kaspi' ? '11 цифр' : '16 цифр')
                : ''
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayoutOpen(false)}>Отменить</Button>
          <Button variant="contained" disabled={!canSubmitPayout || payoutLoading} onClick={() => setConfirmOpen(true)}>
            Отправить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Вывести {amountNum.toLocaleString('ru-RU')} ₸?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handlePayoutSubmit} disabled={payoutLoading}>
            {payoutLoading ? <CircularProgress size={20} /> : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  )
}
