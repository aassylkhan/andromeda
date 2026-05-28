import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded'
import { useOutletContext } from 'react-router-dom'
import {
  appCreateFreezing,
  appDeleteFreezing,
  appGetFreezings,
  appUpdateFreezingEndDate,
  type FreezingDto,
} from '../../api/appFreezingsApi'
import type { AppChild } from '../../api/appAuthApi'
import { useParentChildrenStore } from '../../store/parentChildrenStore'

type OutletCtx = { studentId: number | null; student: AppChild | null }
type MenuMode = 'none' | 'delete' | 'update' | 'ended'

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10)
const todayIso = () => toIsoDate(new Date())
const yesterdayIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toIsoDate(d)
}
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('ru-KZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

export const ParentFreezingPage: React.FC = () => {
  const { student } = useOutletContext<OutletCtx>()
  const { setChildFreezings } = useParentChildrenStore()

  const [items, setItems] = useState<FreezingDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createStartDate, setCreateStartDate] = useState(todayIso())
  const [createEndDate, setCreateEndDate] = useState(todayIso())

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selected, setSelected] = useState<FreezingDto | null>(null)
  const [menuMode, setMenuMode] = useState<MenuMode>('none')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [editEndDate, setEditEndDate] = useState('')

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const studentUid = student?.userId ?? null
  const available = student?.freezings ?? 0

  const load = async () => {
    if (!studentUid) return
    setLoading(true)
    setError(null)
    try {
      const data = await appGetFreezings(studentUid)
      setItems(data)
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось загрузить заморозки'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentUid])

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.startDate === b.startDate) return b.id - a.id
        return a.startDate < b.startDate ? 1 : -1
      }),
    [items]
  )

  const openMenuFor = (event: React.MouseEvent<HTMLElement>, freezing: FreezingDto) => {
    setMenuAnchor(event.currentTarget)
    setSelected(freezing)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
  }

  const onCreate = async () => {
    if (!studentUid) return
    setBusy(true)
    setActionError(null)
    try {
      const res = await appCreateFreezing(studentUid, { startDate: createStartDate, endDate: createEndDate })
      setCreateOpen(false)
      setSuccessMsg('Заморозка успешно создана')
      if (student?.studentId != null) {
        setChildFreezings(student.studentId, res.availableFreezings)
      }
      await load()
    } catch (e: unknown) {
      setActionError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось создать заморозку'
      )
    } finally {
      setBusy(false)
    }
  }

  const resolveActionType = (freezing: FreezingDto): MenuMode => {
    const today = todayIso()
    if (freezing.startDate >= today && freezing.endDate > today) return 'delete'
    if (freezing.startDate < today && freezing.endDate >= today) return 'update'
    return 'ended'
  }

  const onPickAction = () => {
    if (!selected) return
    const mode = resolveActionType(selected)
    setMenuMode(mode)
    setEditEndDate(selected.endDate)
    closeMenu()
  }

  const closeAllActionDialogs = () => {
    setMenuMode('none')
    setConfirmDeleteOpen(false)
    setSelected(null)
  }

  const onDelete = async () => {
    if (!studentUid || !selected) return
    setBusy(true)
    setActionError(null)
    try {
      const res = await appDeleteFreezing(studentUid, selected.id)
      if (student?.studentId != null) {
        setChildFreezings(student.studentId, res.availableFreezings)
      }
      closeAllActionDialogs()
      setSuccessMsg('Заморозка удалена')
      await load()
    } catch (e: unknown) {
      setActionError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось удалить заморозку'
      )
    } finally {
      setBusy(false)
    }
  }

  const onUpdate = async () => {
    if (!studentUid || !selected) return
    setBusy(true)
    setActionError(null)
    try {
      const res = await appUpdateFreezingEndDate(studentUid, selected.id, { endDate: editEndDate })
      if (student?.studentId != null) {
        setChildFreezings(student.studentId, res.availableFreezings)
      }
      closeAllActionDialogs()
      setSuccessMsg('Заморозка обновлена')
      await load()
    } catch (e: unknown) {
      setActionError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось изменить заморозку'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Button variant="contained" onClick={() => setCreateOpen(true)} sx={{ alignSelf: 'stretch' }}>
        Заморозить
      </Button>

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : sortedItems.length === 0 ? (
        <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <AcUnitRoundedIcon sx={{ color: '#637381', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Пока нет заморозок
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нажмите «Заморозить», чтобы создать первую заморозку.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.25}>
          {sortedItems.map((f) => (
            <Card key={f.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '16px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      Создал(а)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {f.createdByFullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Период заморозки
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(f.startDate)} - {formatDate(f.endDate)}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => openMenuFor(e, f)}>
                    <MoreVertRoundedIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={onPickAction}>Действия</MenuItem>
      </Menu>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth>
        <DialogTitle>Заморозить</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '12px !important' }}>
          <Typography variant="body2">
            <strong>Ученик:</strong> {student?.fullName ?? '-'}
          </Typography>
          <Typography variant="body2">
            <strong>Доступно:</strong> {available}
          </Typography>
          <TextField
            type="date"
            label="Дата начала заморозки включительно"
            value={createStartDate}
            onChange={(e) => {
              setCreateStartDate(e.target.value)
              if (createEndDate < e.target.value) setCreateEndDate(e.target.value)
            }}
            inputProps={{ min: todayIso() }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="Дата окончания заморозки включительно"
            value={createEndDate}
            onChange={(e) => setCreateEndDate(e.target.value)}
            inputProps={{ min: createStartDate || todayIso() }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={busy}>
            Отменить
          </Button>
          <Button onClick={() => void onCreate()} disabled={busy} variant="contained">
            Заморозить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={menuMode === 'delete'} onClose={closeAllActionDialogs} fullWidth>
        <DialogTitle>Удалить заморозку</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Вы можете удалить эту заморозку.</Typography>
          {actionError && <Alert severity="error" sx={{ mt: 1 }}>{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllActionDialogs}>Закрыть</Button>
          <Button color="error" variant="contained" onClick={() => setConfirmDeleteOpen(true)}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} fullWidth>
        <DialogTitle>Подтвердите удаление</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Удалить заморозку?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={busy}>
            Отменить
          </Button>
          <Button color="error" variant="contained" onClick={() => void onDelete()} disabled={busy}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={menuMode === 'update'} onClose={closeAllActionDialogs} fullWidth>
        <DialogTitle>Изменить заморозку</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: '12px !important' }}>
          <Typography variant="body2">
            <strong>Дата начала заморозки:</strong> {selected ? formatDate(selected.startDate) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Дата начала заморозки изменить нельзя
          </Typography>
          <TextField
            type="date"
            label="Дата окончания заморозки"
            value={editEndDate}
            onChange={(e) => setEditEndDate(e.target.value)}
            inputProps={{ min: yesterdayIso() }}
            InputLabelProps={{ shrink: true }}
          />
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllActionDialogs} disabled={busy}>
            Отменить
          </Button>
          <Button onClick={() => void onUpdate()} variant="contained" disabled={busy}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={menuMode === 'ended'} onClose={closeAllActionDialogs} fullWidth>
        <DialogTitle>Заморозка завершена</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Вы не можете редактировать заморозку, которая уже закончилась
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllActionDialogs}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(successMsg)} autoHideDuration={3000} onClose={() => setSuccessMsg(null)}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
