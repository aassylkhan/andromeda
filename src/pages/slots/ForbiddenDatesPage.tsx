import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useSnackbar } from 'notistack'
import { deleteForbiddenDate, getForbiddenDates } from '../../entities/forbidden-date/api'
import type { ForbiddenDateItem } from '../../entities/forbidden-date/types'
import { AddForbiddenDatesDialog } from '../../features/slot-dialogs/AddForbiddenDatesDialog'

const TH_SX = {
  fontWeight: 600,
  fontSize: '0.8rem',
  color: '#637381',
  bgcolor: '#F3F6FB',
  borderBottom: '1px solid rgba(145,158,171,0.20)',
  py: 1.5,
  px: 2,
  whiteSpace: 'nowrap',
} as const

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-KZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const fmtDate = (iso: string) => {
  try {
    const [y, m, d] = iso.split('-')
    if (y && m && d) return `${d}.${m}.${y}`
    return new Date(iso + 'T12:00:00').toLocaleDateString('ru-KZ')
  } catch {
    return iso
  }
}

export default function ForbiddenDatesPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState<ForbiddenDateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ForbiddenDateItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getForbiddenDates()
      setItems(data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось загрузить недоступные даты'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteForbiddenDate(deleteTarget.id)
      enqueueSnackbar('Дата удалена', { variant: 'success' })
      setDeleteTarget(null)
      await load()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при удалении'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Недоступные даты
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Добавить
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button variant="contained" onClick={load}>
              Повторить
            </Button>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Недоступные даты не заданы</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={TH_SX}>Дата создания</TableCell>
                  <TableCell sx={TH_SX}>Создано</TableCell>
                  <TableCell sx={TH_SX}>Дата</TableCell>
                  <TableCell sx={{ ...TH_SX, width: 120 }} align="right">
                    Действие
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 } }}
                  >
                    <TableCell>{fmtDateTime(row.createdAt)}</TableCell>
                    <TableCell>{row.createdByFullName}</TableCell>
                    <TableCell>{fmtDate(row.date)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setDeleteTarget(row)}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <AddForbiddenDatesDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false)
          load()
        }}
      />

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Удалить недоступную дату?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {deleteTarget
              ? `Дата ${fmtDate(deleteTarget.date)} будет удалена из списка недоступных.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Отменить
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={22} color="inherit" /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
