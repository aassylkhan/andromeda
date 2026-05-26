import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useSnackbar } from 'notistack'
import {
  getAccountingReferralPayouts,
  markReferralPayoutSent,
} from '../../../entities/accounting/api'
import type { ReferralPayoutListItem } from '../../../entities/accounting/types'
import { useAuthStore } from '../../../entities/auth'
import { hasAnyRole } from '../../../shared/utils/roleUtils'
import ReferralPayoutFilterDialog, {
  type ReferralPayoutFilters,
} from '../../../features/accounting-dialogs/ReferralPayoutFilterDialog'

const TH = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 1.5, whiteSpace: 'nowrap',
} as const

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
  'В обработке': 'warning',
  'Начислено': 'success',
  'Переведено': 'info',
  'Отклонено': 'error',
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-KZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const fmtMoney = (v: number) => Number(v).toLocaleString('ru-KZ') + ' ₸'

const maskBankDetails = (details: string): string => {
  if (details.startsWith('card_')) {
    const digits = details.substring(5)
    return '*' + digits.slice(-4)
  }
  if (details.startsWith('kaspi_')) {
    const phone = details.substring(6)
    return phone.startsWith('7') ? '+' + phone : phone
  }
  return details
}

const emptyFilters: ReferralPayoutFilters = {}

const ReferralPayoutRequestsTab: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const user = useAuthStore((s) => s.user)
  const isAccountant = hasAnyRole(user, ['accountant'])

  const [items, setItems] = useState<ReferralPayoutListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<ReferralPayoutFilters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<number | null>(null)
  const [errorDialog, setErrorDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAccountingReferralPayouts({
        page, size,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        statuses: filters.statuses,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch {
      enqueueSnackbar('Ошибка загрузки', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, size, filters, enqueueSnackbar])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => setPage(0), [filters])

  const handleMarkSent = (id: number) => {
    if (!isAccountant) {
      setErrorDialog(true)
      return
    }
    setConfirmDialog(id)
  }

  const doMarkSent = async () => {
    if (confirmDialog == null) return
    setActionLoading(true)
    try {
      await markReferralPayoutSent(confirmDialog)
      enqueueSnackbar('Заявка отмечена как отправленная', { variant: 'success' })
      fetchData()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setActionLoading(false)
      setConfirmDialog(null)
    }
  }

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(true)}
          sx={{ height: 40, borderRadius: 2, px: 3, bgcolor: '#fff' }}>
          Фильтр
        </Button>
      </Box>

      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <CircularProgress size={48} />
        </Box>
      ) : items.length === 0 && !loading ? (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Запросы не найдены</Box>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={TH}>Дата и время</TableCell>
                <TableCell sx={TH}>ФИ</TableCell>
                <TableCell sx={{ ...TH, textAlign: 'right' }}>Сумма</TableCell>
                <TableCell sx={TH}>Реквизиты</TableCell>
                <TableCell sx={TH}>Статус</TableCell>
                <TableCell sx={TH}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 1.5, whiteSpace: 'nowrap' } }}>
                  <TableCell>{fmtDate(r.createdAt)}</TableCell>
                  <TableCell>{r.userFullName}</TableCell>
                  <TableCell align="right">{fmtMoney(r.amount)}</TableCell>
                  <TableCell>{maskBankDetails(r.bankDetails)}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      color={STATUS_COLORS[r.status] ?? 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {r.status === 'В обработке' && (
                      <Button
                        size="small" variant="outlined" color="success"
                        onClick={() => handleMarkSent(r.id)}
                      >
                        Отправлено
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]} component="div" count={total} rowsPerPage={size} page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0) }}
        labelRowsPerPage="Строк на странице"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`}
      />

      <ReferralPayoutFilterDialog
        open={filterOpen} onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setFilterOpen(false) }}
        initial={filters}
      />

      <Dialog open={confirmDialog != null} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Отметить заявку как отправленную?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={actionLoading}>Отмена</Button>
          <Button variant="contained" onClick={doMarkSent} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialog} onClose={() => setErrorDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Вы не можете выполнить это действие
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorDialog(false)}>ОК</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ReferralPayoutRequestsTab
