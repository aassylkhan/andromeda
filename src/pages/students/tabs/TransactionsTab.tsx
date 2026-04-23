import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { getStudentTransactions } from '../../../entities/student/api'
import type { TransactionItem } from '../../../entities/student/types'

const TH_SX = {
  fontWeight: 600, fontSize: '0.8rem', color: '#637381',
  bgcolor: '#F3F6FB', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 2,
} as const

const formatDateTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const formatAmount = (val: number) =>
  val.toLocaleString('ru-KZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₸'

interface TransactionsTabProps {
  studentId: number
  refreshKey?: number
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ studentId, refreshKey }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getStudentTransactions(studentId))
    } catch {
      enqueueSnackbar('Ошибка загрузки транзакций', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [studentId, enqueueSnackbar])

  useEffect(() => { load() }, [load, refreshKey])

  if (loading && items.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
  }

  if (items.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Транзакции отсутствуют</Typography>
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={TH_SX}>Дата и время</TableCell>
            <TableCell sx={TH_SX} align="right">Сумма</TableCell>
            <TableCell sx={TH_SX}>Вид транзакции</TableCell>
            <TableCell sx={TH_SX}>Детали</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(t.createdAt)}</TableCell>
              <TableCell
                align="right"
                sx={{
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  color: t.amount >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {t.amount >= 0 ? '+' : ''}{formatAmount(t.amount)}
              </TableCell>
              <TableCell>{t.transactionTypeName}</TableCell>
              <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.details ?? <Typography component="span" variant="body2" color="text.disabled">—</Typography>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
