import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useSnackbar } from 'notistack'
import {
  getAccountingExtensionRequests,
  confirmErPayment, denyErPayment,
  confirmErSignature, denyErSignature,
} from '../../../entities/accounting/api'
import type { ExtensionRequestListItem } from '../../../entities/accounting/types'
import { useAuthStore } from '../../../entities/auth'
import { hasAnyRole } from '../../../shared/utils/roleUtils'
import AccountingFilterDialog, { type AccountingFilters } from '../../../features/accounting-dialogs/AccountingFilterDialog'

const TH = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 1.5, whiteSpace: 'nowrap',
} as const

const statusChip = (val: string | null) => {
  if (val === 'confirmed') return { label: 'Подтверждено', color: 'success' as const }
  if (val === 'denied') return { label: 'Опровергнуто', color: 'error' as const }
  return { label: 'Не известно', color: 'default' as const }
}

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

const fmtMoney = (v: number) => Number(v).toLocaleString('ru-KZ') + ' ₸'

type ActionType = 'confirmPayment' | 'denyPayment' | 'confirmSignature' | 'denySignature'

const ExtensionRequestsTab: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const user = useAuthStore((s) => s.user)
  const isAccountant = hasAnyRole(user, ['accountant'])

  const [items, setItems] = useState<ExtensionRequestListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<AccountingFilters>({})
  const [filterOpen, setFilterOpen] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{ id: number; action: ActionType; label: string } | null>(null)
  const [errorDialog, setErrorDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAccountingExtensionRequests({
        page, size,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        createdByIds: filters.personIds,
        paymentStatuses: filters.paymentStatuses,
        signatureStatuses: filters.signatureStatuses,
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

  const handleAction = (id: number, action: ActionType, label: string) => {
    if (!isAccountant) {
      setErrorDialog(true)
      return
    }
    setConfirmDialog({ id, action, label })
  }

  const doAction = async () => {
    if (!confirmDialog) return
    setActionLoading(true)
    try {
      const fns = { confirmPayment: confirmErPayment, denyPayment: denyErPayment, confirmSignature: confirmErSignature, denySignature: denyErSignature }
      await fns[confirmDialog.action](confirmDialog.id)
      enqueueSnackbar('Действие выполнено', { variant: 'success' })
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}><CircularProgress size={48} /></Box>
      ) : items.length === 0 && !loading ? (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Запросы не найдены</Box>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TH, width: 50 }}>ID</TableCell>
                <TableCell sx={TH}>Дата и время</TableCell>
                <TableCell sx={TH}>Ученик</TableCell>
                <TableCell sx={TH}>Сотрудник</TableCell>
                <TableCell sx={{ ...TH, textAlign: 'right' }}>Часы</TableCell>
                <TableCell sx={{ ...TH, textAlign: 'right' }}>Стоимость</TableCell>
                <TableCell sx={TH}>Оплата</TableCell>
                <TableCell sx={TH}>Подпись</TableCell>
                <TableCell sx={TH}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((er) => {
                const pSt = statusChip(er.paymentConfirmation)
                const sSt = statusChip(er.signatureConfirmation)
                return (
                  <TableRow key={er.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 1.5, whiteSpace: 'nowrap' } }}>
                    <TableCell>{er.id}</TableCell>
                    <TableCell>{fmtDate(er.createdAt)}</TableCell>
                    <TableCell>{er.studentFullName}</TableCell>
                    <TableCell>{er.createdByFullName}</TableCell>
                    <TableCell align="right">{er.hours}</TableCell>
                    <TableCell align="right">{fmtMoney(er.fee)}</TableCell>
                    <TableCell><Chip label={pSt.label} color={pSt.color} size="small" /></TableCell>
                    <TableCell><Chip label={sSt.label} color={sSt.color} size="small" /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {er.paymentConfirmation !== 'confirmed' && (
                          <Button size="small" variant="outlined" color="success"
                            onClick={() => handleAction(er.id, 'confirmPayment', 'Подтвердить оплату?')}>✓ Оплата</Button>
                        )}
                        {er.paymentConfirmation !== 'denied' && (
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => handleAction(er.id, 'denyPayment', 'Опровергнуть оплату?')}>✕ Оплата</Button>
                        )}
                        {er.signatureConfirmation !== 'confirmed' && (
                          <Button size="small" variant="outlined" color="success"
                            onClick={() => handleAction(er.id, 'confirmSignature', 'Подтвердить подпись?')}>✓ Подпись</Button>
                        )}
                        {er.signatureConfirmation !== 'denied' && (
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => handleAction(er.id, 'denySignature', 'Опровергнуть подпись?')}>✕ Подпись</Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
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

      <AccountingFilterDialog
        open={filterOpen} onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setFilterOpen(false) }}
        initial={filters} personLabel="Сотрудник" personParamKey="createdByIds"
      />

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent><Typography variant="body1" sx={{ mt: 1 }}>{confirmDialog?.label}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={actionLoading}>Отмена</Button>
          <Button variant="contained" onClick={doAction} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialog} onClose={() => setErrorDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>Вы не можете подтверждать/опровергать оплаты/подписи</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorDialog(false)}>ОК</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ExtensionRequestsTab
