import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useSnackbar } from 'notistack'
import {
  getPaymentRequests,
  confirmPayment,
  denyPayment,
  confirmSignature,
  denySignature,
} from '../../entities/payment-request/api'
import type { PaymentRequestItem } from '../../entities/payment-request/types'
import { PaymentRequestsFilterDialog } from '../../features/payment-dialogs/PaymentRequestsFilterDialog'
import type { PaymentRequestFilters } from '../../features/payment-dialogs/PaymentRequestsFilterDialog'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 2, whiteSpace: 'nowrap',
} as const

const statusLabel = (val: string | null) => {
  if (val === 'confirmed') return { label: 'Подтверждено', color: 'success' as const }
  if (val === 'denied') return { label: 'Опровергнуто', color: 'error' as const }
  return { label: 'Не известно', color: 'default' as const }
}

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

const emptyFilters: PaymentRequestFilters = {}

const PaymentRequestsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState<PaymentRequestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<PaymentRequestFilters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    id: number
    action: 'confirmPayment' | 'denyPayment' | 'confirmSignature' | 'denySignature'
    label: string
  } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPaymentRequests({
        page, size,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        expertIds: filters.expertIds,
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

  const doAction = async () => {
    if (!confirmDialog) return
    try {
      const fns = { confirmPayment, denyPayment, confirmSignature, denySignature }
      await fns[confirmDialog.action](confirmDialog.id)
      enqueueSnackbar('Действие выполнено', { variant: 'success' })
      fetchData()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ошибка'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setConfirmDialog(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Новые оплаты</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined" startIcon={<FilterListIcon />}
          onClick={() => setFilterOpen(true)}
          sx={{ height: 48, borderRadius: 2, px: 3, bgcolor: '#fff' }}
        >
          Фильтр
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}><CircularProgress size={48} /></Box>
        ) : items.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Запросы не найдены</Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...TH_SX, width: 60 }}>ID</TableCell>
                  <TableCell sx={TH_SX}>Дата</TableCell>
                  <TableCell sx={TH_SX}>Ученик</TableCell>
                  <TableCell sx={TH_SX}>Эксперт</TableCell>
                  <TableCell sx={TH_SX}>Родитель</TableCell>
                  <TableCell sx={TH_SX}>Продукт</TableCell>
                  <TableCell sx={{ ...TH_SX, textAlign: 'right' }}>Итого</TableCell>
                  <TableCell sx={TH_SX}>Оплата</TableCell>
                  <TableCell sx={TH_SX}>Подпись</TableCell>
                  <TableCell sx={TH_SX}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((pr) => {
                  const pSt = statusLabel(pr.paymentConfirmation)
                  const sSt = statusLabel(pr.signatureConfirmation)
                  return (
                    <TableRow key={pr.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2, whiteSpace: 'nowrap' } }}>
                      <TableCell>{pr.id}</TableCell>
                      <TableCell>{formatDate(pr.createdAt)}</TableCell>
                      <TableCell>{pr.studentFullName}</TableCell>
                      <TableCell>{pr.expertFullName}</TableCell>
                      <TableCell>{pr.parentFullName}</TableCell>
                      <TableCell>{pr.productName}</TableCell>
                      <TableCell align="right">{pr.totalFee.toLocaleString()} ₸</TableCell>
                      <TableCell><Chip label={pSt.label} color={pSt.color} size="small" /></TableCell>
                      <TableCell><Chip label={sSt.label} color={sSt.color} size="small" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {pr.paymentConfirmation !== 'confirmed' && (
                            <Button size="small" variant="outlined" color="success"
                              onClick={() => setConfirmDialog({ id: pr.id, action: 'confirmPayment', label: 'Подтвердить оплату?' })}>
                              ✓ Оплата
                            </Button>
                          )}
                          {pr.paymentConfirmation !== 'denied' && (
                            <Button size="small" variant="outlined" color="error"
                              onClick={() => setConfirmDialog({ id: pr.id, action: 'denyPayment', label: 'Опровергнуть оплату?' })}>
                              ✕ Оплата
                            </Button>
                          )}
                          {pr.signatureConfirmation !== 'confirmed' && (
                            <Button size="small" variant="outlined" color="success"
                              onClick={() => setConfirmDialog({ id: pr.id, action: 'confirmSignature', label: 'Подтвердить подпись?' })}>
                              ✓ Подпись
                            </Button>
                          )}
                          {pr.signatureConfirmation !== 'denied' && (
                            <Button size="small" variant="outlined" color="error"
                              onClick={() => setConfirmDialog({ id: pr.id, action: 'denySignature', label: 'Опровергнуть подпись?' })}>
                              ✕ Подпись
                            </Button>
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
          rowsPerPageOptions={[10, 20, 50]}
          component="div" count={total} rowsPerPage={size} page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0) }}
          labelRowsPerPage="Строк на странице"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`}
        />
      </Paper>

      <PaymentRequestsFilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setFilterOpen(false) }}
        initial={filters}
      />

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>{confirmDialog?.label}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Отмена</Button>
          <Button variant="contained" onClick={doAction}>Подтвердить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaymentRequestsPage
