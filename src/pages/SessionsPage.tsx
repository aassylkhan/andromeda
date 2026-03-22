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
import { Delete as DeleteIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { deleteMySession, deleteOtherSessions, getMySessions } from '../entities/session'
import type { Session } from '../entities/session'

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

function parseBrowser(ua: string | null | undefined): string {
  if (!ua) return '—'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return ua.length > 30 ? ua.slice(0, 30) + '…' : ua
}

export function SessionsPage() {
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
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сессии')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSessions()
  }, [])

  const handleDelete = async (sid: string) => {
    setDeletingSid(sid)
    try {
      await deleteMySession(sid)
      enqueueSnackbar('Сессия удалена', { variant: 'success' })
      await fetchSessions()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Не удалось удалить сессию', { variant: 'error' })
    } finally {
      setDeletingSid(null)
    }
  }

  const handleDeleteOthers = async () => {
    setLoading(true)
    try {
      await deleteOtherSessions()
      enqueueSnackbar('Все сессии, кроме текущей, удалены', { variant: 'success' })
      await fetchSessions()
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const hasOtherSessions = sessions.some((s) => !s.isCurrent)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Сессии входа
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            onClick={() => void handleDeleteOthers()}
            disabled={loading || !hasOtherSessions}
            sx={{ height: 48, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
          >
            Завершить все кроме текущей
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {error && (
          <Box sx={{ p: 2, pb: 0 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          </Box>
        )}

        {loading && sessions.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#637381',
                      bgcolor: '#F3F6FB',
                      borderBottom: '1px solid rgba(145,158,171,0.20)',
                      py: 1.5,
                      px: 2,
                    },
                  }}
                >
                  <TableCell>Первый вход</TableCell>
                  <TableCell>Последний визит</TableCell>
                  <TableCell>IP адрес</TableCell>
                  <TableCell>Браузер</TableCell>
                  <TableCell align="center">Тип</TableCell>
                  <TableCell align="right">Удалить</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.sid}
                    hover
                    selected={session.isCurrent}
                    sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 } }}
                  >
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.lastSeenAt)}</TableCell>
                    <TableCell>{session.ip || '—'}</TableCell>
                    <TableCell>
                      <Tooltip title={session.userAgent || ''}>
                        <span>{parseBrowser(session.userAgent)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {session.isCurrent ? (
                        <Chip
                          label="Текущая"
                          size="small"
                          sx={{ height: 24, borderRadius: 999, fontSize: 12, fontWeight: 700, bgcolor: '#22C55E', color: '#fff' }}
                        />
                      ) : (
                        <Chip
                          label="Другая"
                          size="small"
                          sx={{ height: 24, borderRadius: 999, fontSize: 12, fontWeight: 700, bgcolor: 'rgba(145,158,171,0.18)', color: '#637381' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={session.isCurrent ? 'Нельзя удалить текущую сессию' : 'Удалить сессию'}>
                        <span>
                          <IconButton
                            color="error"
                            size="small"
                            disabled={session.isCurrent || deletingSid === session.sid || loading}
                            onClick={() => void handleDelete(session.sid)}
                          >
                            {deletingSid === session.sid ? <CircularProgress size={18} /> : <DeleteIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {sessions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      Нет активных сессий
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
