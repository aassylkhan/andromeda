import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete, Chip,
} from '@mui/material'

export interface ReferralPayoutFilters {
  createdFrom?: string
  createdTo?: string
  statuses?: string[]
}

const ALL_STATUSES = ['В обработке', 'Начислено', 'Переведено', 'Отклонено']

interface Props {
  open: boolean
  onClose: () => void
  onApply: (filters: ReferralPayoutFilters) => void
  initial: ReferralPayoutFilters
}

const ReferralPayoutFilterDialog: React.FC<Props> = ({ open, onClose, onApply, initial }) => {
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setCreatedFrom(initial.createdFrom ? initial.createdFrom.slice(0, 16) : '')
      setCreatedTo(initial.createdTo ? initial.createdTo.slice(0, 16) : '')
      setStatuses(initial.statuses ?? [])
    }
  }, [open, initial])

  const handleApply = () => {
    onApply({
      ...(createdFrom && { createdFrom: new Date(createdFrom).toISOString() }),
      ...(createdTo && { createdTo: new Date(createdTo).toISOString() }),
      ...(statuses.length > 0 && { statuses }),
    })
  }

  const handleReset = () => {
    setCreatedFrom('')
    setCreatedTo('')
    setStatuses([])
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Фильтр</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        <TextField
          label="Дата ОТ" type="datetime-local" size="small" fullWidth
          value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Дата ДО" type="datetime-local" size="small" fullWidth
          value={createdTo} onChange={(e) => setCreatedTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Autocomplete
          multiple size="small" options={ALL_STATUSES}
          value={statuses}
          onChange={(_, v) => setStatuses(v)}
          renderTags={(value, getTagProps) =>
            value.map((opt, index) => (
              <Chip label={opt} size="small" {...getTagProps({ index })} key={opt} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Статус" />}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} color="inherit">Сбросить</Button>
        <Button onClick={onClose} color="inherit">Отменить</Button>
        <Button variant="contained" onClick={handleApply}>Применить</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReferralPayoutFilterDialog
