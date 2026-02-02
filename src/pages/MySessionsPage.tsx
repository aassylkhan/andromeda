import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Button,
  CircularProgress,
  TableContainer,
  Stack,
} from '@mui/material'
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { deleteMySession, deleteOtherSessions, getMySessions } from '../entities/session'
import type { Session } from '../entities/session'
import { formatDate } from './employees/utils'

export function MySessionsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingSid, setDeletingSid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMySessions()
      setSessions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить сессии'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSessions()
  }, [])

  const handleDelete = async (sid: string) => {
    setDeletingSid(sid)
    setError(null)
    try {
      await deleteMySession(sid)
      enqueueSnackbar('Сессия удалена', { variant: 'success' })
      await fetchSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить сессию'
      setError(message)
    } finally {
      setDeletingSid(null)
    }
  }

  const handleDeleteOthers = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteOtherSessions()
      enqueueSnackbar('Все сессии, кроме текущей, удалены', { variant: 'success' })
      await fetchSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить сессии'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h1" sx={{ fontWeight: 800, color: '#141A21', fontSize: '2rem' }}>
        Мои сессии
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchSessions()} disabled={loading} sx={{ height: 56, borderRadius: 2, px: 3 }}>
            Обновить
          </Button>

          <Button variant="contained" onClick={() => void handleDeleteOthers()} disabled={loading || sessions.length === 0} sx={{ height: 56, borderRadius: 2, px: 3 }}>
            Завершить все кроме текущей
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, boxShadow: '0 0 2px 0 rgba(145,158,171,0.20), 0 12px 24px -4px rgba(145,158,171,0.12)', overflow: 'hidden' }}>
        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', zIndex: 1 }}>
              <CircularProgress size={48} thickness={4} />
            </Box>
          )}

          <TableContainer sx={{ overflow: 'hidden' }}>
            <Table sx={{ bgcolor: '#FFFFFF' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F3F6FB', '& .MuiTableCell-root': { bgcolor: '#F3F6FB', fontWeight: 600, fontSize: '0.875rem', color: '#637381', borderBottom: '1px solid rgba(145,158,171,0.20)', py: 1.5, px: 3 } }}>
                  <TableCell>Создана</TableCell>
                  <TableCell>Последний визит</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>User-Agent</TableCell>
                  <TableCell align="center">Текущая</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.sid} hover selected={session.isCurrent} sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 3 } }}>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.lastSeenAt)}</TableCell>
                    <TableCell>{session.ip || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Tooltip title={session.userAgent}>
                        <span>{session.userAgent || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {session.isCurrent ? (
                        <Chip label="Текущая" sx={{ height: 24, borderRadius: 999, fontSize: 12, fontWeight: 700, bgcolor: '#22C55E', color: '#fff' }} />
                      ) : (
                        <Chip label="Другая" sx={{ height: 24, borderRadius: 999, fontSize: 12, fontWeight: 700, bgcolor: 'rgba(145,158,171,0.18)', color: '#637381' }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={session.isCurrent ? 'Нельзя удалить текущую сессию' : 'Удалить сессию'}>
                        <span>
                          <IconButton color="error" size="small" disabled={session.isCurrent || deletingSid === session.sid || loading} onClick={() => void handleDelete(session.sid)}>
                            {deletingSid === session.sid ? <CircularProgress size={18} /> : <DeleteIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {sessions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      Нет активных сессий
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  )
}
