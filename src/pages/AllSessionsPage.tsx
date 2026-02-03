import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TableContainer,
  InputAdornment,
  Stack,
} from '@mui/material'
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { deleteUserSession, deleteUserSessions, getUserSessions } from '../entities/session'
import type { Session } from '../entities/session'
import { formatDate } from './employees/utils'

export function AllSessionsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [userId, setUserId] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingSid, setDeletingSid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    if (!userId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await getUserSessions(userId.trim())
      setSessions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить сессии'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // авто-запрос не делаем, только по кнопке
  }, [])

  const handleDelete = async (sid: string) => {
    if (!userId.trim()) return
    setDeletingSid(sid)
    setError(null)
    try {
      await deleteUserSession(userId.trim(), sid)
      enqueueSnackbar('Сессия удалена', { variant: 'success' })
      await fetchSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить сессию'
      setError(message)
    } finally {
      setDeletingSid(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!userId.trim()) return
    setLoading(true)
    setError(null)
    try {
      await deleteUserSessions(userId.trim())
      enqueueSnackbar('Все сессии пользователя удалены', { variant: 'success' })
      setSessions([])
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
        Все сессии пользователя
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="userId"
          variant="outlined"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
          sx={{ flex: '1 1 520px', maxWidth: 750 }}
        />

        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => void fetchSessions()} disabled={!userId.trim() || loading} sx={{ height: 56, borderRadius: 2, px: 3 }}>
            Загрузить
          </Button>

          <Button variant="outlined" color="error" onClick={() => void handleDeleteAll()} disabled={!userId.trim() || loading || sessions.length === 0} sx={{ height: 56, borderRadius: 2, px: 3, whiteSpace: 'nowrap', borderColor: 'rgba(145,158,171,0.20)' }}>
            Удалить все
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
                  <TableRow key={session.sid} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 3 } }}>
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
                      <Tooltip title="Удалить сессию">
                        <span>
                          <IconButton color="error" size="small" disabled={loading || deletingSid === session.sid} onClick={() => void handleDelete(session.sid)}>
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
                      Нет сессий
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
