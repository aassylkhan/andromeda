import React, { useState, useEffect } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Chip,
} from '@mui/material'
import { getExperts } from '../../entities/lookup/api'
import type { LookupDto } from '../../entities/lookup/types'

export interface PaymentRequestFilters {
  createdFrom?: string
  createdTo?: string
  expertIds?: number[]
  paymentStatuses?: string[]
  signatureStatuses?: string[]
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'denied', label: 'Опровергнуто' },
  { value: 'null', label: 'Не известно' },
]

interface Props {
  open: boolean
  onClose: () => void
  onApply: (filters: PaymentRequestFilters) => void
  initial: PaymentRequestFilters
}

export const PaymentRequestsFilterDialog: React.FC<Props> = ({ open, onClose, onApply, initial }) => {
  const [experts, setExperts] = useState<LookupDto[]>([])
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? '')
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? '')
  const [selectedExperts, setSelectedExperts] = useState<LookupDto[]>([])
  const [paymentStatuses, setPaymentStatuses] = useState<typeof STATUS_OPTIONS>([])
  const [signatureStatuses, setSignatureStatuses] = useState<typeof STATUS_OPTIONS>([])

  useEffect(() => {
    if (!open) return
    getExperts().then(setExperts).catch(() => {})
  }, [open])

  useEffect(() => {
    if (open) {
      setCreatedFrom(initial.createdFrom ?? '')
      setCreatedTo(initial.createdTo ?? '')
    }
  }, [open, initial])

  const handleApply = () => {
    onApply({
      createdFrom: createdFrom ? new Date(createdFrom + 'T00:00:00').toISOString() : undefined,
      createdTo: createdTo ? new Date(createdTo + 'T23:59:59').toISOString() : undefined,
      expertIds: selectedExperts.length ? selectedExperts.map((e) => e.id) : undefined,
      paymentStatuses: paymentStatuses.length ? paymentStatuses.map((s) => s.value) : undefined,
      signatureStatuses: signatureStatuses.length ? signatureStatuses.map((s) => s.value) : undefined,
    })
  }

  const handleReset = () => {
    setCreatedFrom('')
    setCreatedTo('')
    setSelectedExperts([])
    setPaymentStatuses([])
    setSignatureStatuses([])
    onApply({})
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Фильтр</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Дата ОТ" type="date" value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              fullWidth size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Дата ДО" type="date" value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              fullWidth size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Autocomplete
            multiple options={experts}
            getOptionLabel={(o) => o.name}
            value={selectedExperts}
            onChange={(_, v) => setSelectedExperts(v)}
            renderInput={(params) => <TextField {...params} label="Эксперт" size="small" />}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => <Chip {...getTagProps({ index: idx })} key={opt.id} label={opt.name} size="small" />)
            }
          />

          <Autocomplete
            multiple options={STATUS_OPTIONS}
            getOptionLabel={(o) => o.label}
            value={paymentStatuses}
            onChange={(_, v) => setPaymentStatuses(v)}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            renderInput={(params) => <TextField {...params} label="Статус оплаты" size="small" />}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => <Chip {...getTagProps({ index: idx })} key={opt.value} label={opt.label} size="small" />)
            }
          />

          <Autocomplete
            multiple options={STATUS_OPTIONS}
            getOptionLabel={(o) => o.label}
            value={signatureStatuses}
            onChange={(_, v) => setSignatureStatuses(v)}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            renderInput={(params) => <TextField {...params} label="Статус подписи" size="small" />}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => <Chip {...getTagProps({ index: idx })} key={opt.value} label={opt.label} size="small" />)
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Сбросить</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button variant="contained" onClick={handleApply}>Применить</Button>
      </DialogActions>
    </Dialog>
  )
}
