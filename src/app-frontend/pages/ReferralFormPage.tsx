import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import axios from 'axios'
import { AppShell } from '../components/AppShell'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.andromedaedu.kz'

export const ReferralFormPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') ?? ''

  const [name, setName] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const fullPhone = '7' + phoneDigits
  const isPhoneValid = phoneDigits.length === 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !isPhoneValid || !code) return

    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/api/v1/public/referral-form/submit`, {
        code,
        name: name.trim(),
        phoneNumber: '+' + fullPhone,
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка отправки'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!code) {
    return (
      <AppShell>
        <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Alert severity="error">Недействительная реферальная ссылка</Alert>
        </Box>
      </AppShell>
    )
  }

  if (submitted) {
    return (
      <AppShell>
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 3,
            py: 4,
            gap: 2,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(34,197,94,0.10)',
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Заявка отправлена!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
            Мы свяжемся с вами в ближайшее время. Спасибо за интерес к нашим программам!
          </Typography>
        </Box>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
          gap: 3,
        }}
      >
        <Box
          component="img"
          src="/logo-andro.jpg"
          alt="Andromeda"
          sx={{
            width: 96,
            height: 96,
            borderRadius: 3,
            objectFit: 'cover',
          }}
        />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Andromeda Astana
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Обучение для детей 4-11 классов
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Подготовка к ЕНТ, НИШ, БИЛ, РФМШ и СОР/СОЧ
          </Typography>
        </Box>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <TextField
            fullWidth
            label="Номер телефона"
            value={phoneDigits}
            onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={loading}
            slotProps={{ htmlInput: { inputMode: 'tel' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body1" sx={{ fontWeight: 600, userSelect: 'none' }}>
                    +7
                  </Typography>
                </InputAdornment>
              ),
            }}
            error={phoneDigits.length > 0 && !isPhoneValid}
            helperText={phoneDigits.length > 0 && !isPhoneValid ? 'Введите 10 цифр после +7' : ''}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !name.trim() || !isPhoneValid}
            sx={{ minHeight: 48 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Отправить'}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Туркестан 46
        </Typography>
      </Box>
    </AppShell>
  )
}
