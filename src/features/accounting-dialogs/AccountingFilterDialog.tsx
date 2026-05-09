import React, { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, FormControl, FormLabel,
  Checkbox, ListItemText, MenuItem, Select,
  type SelectChangeEvent,
} from '@mui/material'

export interface AccountingFilters {
  createdFrom?: string
  createdTo?: string
  personIds?: number[]
  paymentStatuses?: string[]
  signatureStatuses?: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  onApply: (f: AccountingFilters) => void
  initial: AccountingFilters
  personLabel: string
  personParamKey: string
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'denied', label: 'Опровергнуто' },
  { value: 'null', label: 'Не известно' },
]

const AccountingFilterDialog: React.FC<Props> = ({ open, onClose, onApply, initial, personLabel }) => {
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? '')
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? '')
  const [paymentStatuses, setPaymentStatuses] = useState<string[]>(initial.paymentStatuses ?? [])
  const [signatureStatuses, setSignatureStatuses] = useState<string[]>(initial.signatureStatuses ?? [])

  const handleApply = () => {
    onApply({
      ...(createdFrom && { createdFrom }),
      ...(createdTo && { createdTo }),
      ...(paymentStatuses.length && { paymentStatuses }),
      ...(signatureStatuses.length && { signatureStatuses }),
    })
  }

  const handleReset = () => {
    setCreatedFrom('')
    setCreatedTo('')
    setPaymentStatuses([])
    setSignatureStatuses([])
  }

  const handlePaymentChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value
    setPaymentStatuses(typeof val === 'string' ? val.split(',') : val)
  }

  const handleSignatureChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value
    setSignatureStatuses(typeof val === 'string' ? val.split(',') : val)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Фильтр — {personLabel}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Дата ОТ" type="date" fullWidth size="small"
              value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Дата ДО" type="date" fullWidth size="small"
              value={createdTo} onChange={(e) => setCreatedTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5, fontSize: '0.875rem' }}>Статус оплаты</FormLabel>
            <Select
              multiple value={paymentStatuses} onChange={handlePaymentChange}
              renderValue={(sel) => sel.map((v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v).join(', ')}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  <Checkbox checked={paymentStatuses.includes(o.value)} size="small" />
                  <ListItemText primary={o.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5, fontSize: '0.875rem' }}>Статус подписи</FormLabel>
            <Select
              multiple value={signatureStatuses} onChange={handleSignatureChange}
              renderValue={(sel) => sel.map((v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v).join(', ')}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  <Checkbox checked={signatureStatuses.includes(o.value)} size="small" />
                  <ListItemText primary={o.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

export default AccountingFilterDialog
