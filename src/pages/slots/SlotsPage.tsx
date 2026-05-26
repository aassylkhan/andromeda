import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useAuthStore } from '../../entities/auth'
import { getOffices } from '../../entities/lookup/api'
import type { LookupDto } from '../../entities/lookup/types'
import { getSlotsMatrix } from '../../entities/slot/api'
import type { SlotMatrixResponse } from '../../entities/slot/types'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import { EditSlotDialog, type EditSlotTarget } from '../../features/slot-dialogs/EditSlotDialog'

const COL_LANGUAGE_WIDTH = 180
const COL_PRODUCT_WIDTH = 200
const COL_HOUR_WIDTH = 160
const ROW_HEIGHT = 64

// Soft-pastel cell colours — match the platform's palette so it does not
// look aggressive when used across the whole matrix.
const CELL_BG_RED = '#FEE7E5' // X >= Y (over-quota / equal)
const CELL_BG_GREEN = '#E6F4EA' // X < Y (under quota)
const CELL_TEXT_RED = '#B42318'
const CELL_TEXT_GREEN = '#1F7A3A'
const HEADER_BG = '#F4F6F8'

type CellTone = 'red' | 'green' | 'neutral'

function pickCellTone(x: number, y: number): CellTone {
  if (x === 0 && y === 0) return 'neutral'
  if (x >= y) return 'red'
  return 'green'
}

interface LanguageGroup {
  learningLanguageId: number
  learningLanguageName: string
  rows: SlotMatrixResponse['rows']
}

function groupRowsByLanguage(matrix: SlotMatrixResponse | null): LanguageGroup[] {
  if (!matrix) return []
  const result: LanguageGroup[] = []
  for (const row of matrix.rows) {
    const last = result[result.length - 1]
    if (last && last.learningLanguageId === row.learningLanguageId) {
      last.rows.push(row)
    } else {
      result.push({
        learningLanguageId: row.learningLanguageId,
        learningLanguageName: row.learningLanguageName,
        rows: [row],
      })
    }
  }
  return result
}

export default function SlotsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const canEdit = useMemo(() => hasAnyRole(user, ['head', 'director']), [user])
  const canManageForbiddenDates = canEdit

  const [offices, setOffices] = useState<LookupDto[]>([])
  const [officesLoaded, setOfficesLoaded] = useState(false)
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null)
  const [matrix, setMatrix] = useState<SlotMatrixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editMode, setEditMode] = useState(false)
  const [noAccessOpen, setNoAccessOpen] = useState(false)
  const [forbiddenAccessOpen, setForbiddenAccessOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditSlotTarget | null>(null)

  // ----- offices: load once and pick default office -----
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getOffices()
        if (cancelled) return
        setOffices(data)
        const queryOfficeId = Number(searchParams.get('officeId'))
        const fromQuery = data.find((o) => o.id === queryOfficeId)
        if (fromQuery) {
          setSelectedOfficeId(fromQuery.id)
        } else if (data.some((o) => o.id === 1)) {
          setSelectedOfficeId(1)
        } else if (data.length > 0) {
          setSelectedOfficeId(data[0].id)
        } else {
          setSelectedOfficeId(null)
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar('Не удалось загрузить список филиалов', { variant: 'error' })
        }
      } finally {
        if (!cancelled) setOfficesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ----- matrix: load whenever selected office changes -----
  const loadMatrix = useCallback(
    async (officeId: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await getSlotsMatrix(officeId)
        setMatrix(data)
      } catch (e) {
        setMatrix(null)
        const message =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось загрузить матрицу слотов'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (selectedOfficeId == null) {
      setMatrix(null)
      setLoading(false)
      return
    }
    // Keep the URL in sync so users can share / reload preserving the filter.
    if (Number(searchParams.get('officeId')) !== selectedOfficeId) {
      const next = new URLSearchParams(searchParams)
      next.set('officeId', String(selectedOfficeId))
      setSearchParams(next, { replace: true })
    }
    loadMatrix(selectedOfficeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfficeId, loadMatrix])

  const languageGroups = useMemo(() => groupRowsByLanguage(matrix), [matrix])

  // ----- handlers -----

  const handleOfficeChange = (newId: number) => {
    if (editMode) return
    setSelectedOfficeId(newId)
  }

  const handleForbiddenDatesClick = () => {
    if (!canManageForbiddenDates) {
      setForbiddenAccessOpen(true)
      return
    }
    navigate('/slots/forbidden-dates')
  }

  const handleToggleEdit = () => {
    if (editMode) {
      setEditMode(false)
      return
    }
    if (!canEdit) {
      setNoAccessOpen(true)
      return
    }
    setEditMode(true)
  }

  const handleCellClick = (
    languageId: number,
    languageName: string,
    productId: number,
    productName: string,
    hourOptionId: number,
    hourOptionName: string,
    quota: number,
    comment: string | null
  ) => {
    if (!editMode || !canEdit || !matrix) return
    setEditTarget({
      learningLanguageId: languageId,
      learningLanguageName: languageName,
      productId,
      productName,
      officeId: matrix.officeId,
      officeName: matrix.officeName,
      learningHourOptionId: hourOptionId,
      learningHourOptionName: hourOptionName,
      quota,
      comment,
    })
  }

  const handleSlotSaved = () => {
    setEditTarget(null)
    if (selectedOfficeId != null) {
      loadMatrix(selectedOfficeId)
    }
  }

  // ----- render -----

  if (!officesLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Слоты
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleForbiddenDatesClick}
            disabled={editMode}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Недоступные даты
          </Button>
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={editMode}>
            <InputLabel>Филиал</InputLabel>
            <Select
              value={selectedOfficeId ?? ''}
              label="Филиал"
              onChange={(e) => handleOfficeChange(Number(e.target.value))}
            >
              {offices.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant={editMode ? 'outlined' : 'contained'}
            startIcon={editMode ? <VisibilityOutlinedIcon /> : <EditOutlinedIcon />}
            onClick={handleToggleEdit}
          >
            {editMode ? 'Вернуться к просмотру' : 'Редактировать'}
          </Button>
        </Box>
      </Box>

      {selectedOfficeId == null ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Нет доступных филиалов для отображения матрицы слотов.
          </Typography>
        </Paper>
      ) : loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 320,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => loadMatrix(selectedOfficeId)}>
            Повторить
          </Button>
        </Paper>
      ) : !matrix || matrix.rows.length === 0 || matrix.hourOptions.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Нет данных для отображения. Убедитесь, что в системе есть языки обучения,
            продукты и время обучения.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            position: 'relative',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            component="table"
            sx={{
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: 'max-content',
              minWidth: '100%',
              tableLayout: 'fixed',
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box
                  component="th"
                  sx={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    zIndex: 5,
                    width: COL_LANGUAGE_WIDTH,
                    minWidth: COL_LANGUAGE_WIDTH,
                    bgcolor: HEADER_BG,
                    borderBottom: '2px solid',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textAlign: 'left',
                  }}
                >
                  Язык обучения
                </Box>
                <Box
                  component="th"
                  sx={{
                    position: 'sticky',
                    top: 0,
                    left: COL_LANGUAGE_WIDTH,
                    zIndex: 5,
                    width: COL_PRODUCT_WIDTH,
                    minWidth: COL_PRODUCT_WIDTH,
                    bgcolor: HEADER_BG,
                    borderBottom: '2px solid',
                    borderRight: '2px solid',
                    borderColor: 'divider',
                    p: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textAlign: 'left',
                  }}
                >
                  Продукт
                </Box>
                {matrix.hourOptions.map((hour) => (
                  <Box
                    component="th"
                    key={hour.id}
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 4,
                      width: COL_HOUR_WIDTH,
                      minWidth: COL_HOUR_WIDTH,
                      bgcolor: HEADER_BG,
                      borderBottom: '2px solid',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {hour.name}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box component="tbody">
              {languageGroups.map((group) =>
                group.rows.map((row, rowIdxInGroup) => {
                  const isFirstOfLanguage = rowIdxInGroup === 0
                  return (
                    <Box component="tr" key={`${row.learningLanguageId}-${row.productId}`}>
                      {isFirstOfLanguage && (
                        <Box
                          component="td"
                          rowSpan={group.rows.length}
                          sx={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 3,
                            bgcolor: '#FAFBFC',
                            borderRight: '1px solid',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            p: 1.25,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'text.primary',
                            verticalAlign: 'top',
                            width: COL_LANGUAGE_WIDTH,
                            minWidth: COL_LANGUAGE_WIDTH,
                          }}
                        >
                          {group.learningLanguageName}
                        </Box>
                      )}
                      <Box
                        component="td"
                        sx={{
                          position: 'sticky',
                          left: COL_LANGUAGE_WIDTH,
                          zIndex: 2,
                          bgcolor: '#FFFFFF',
                          borderRight: '2px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          p: 1.25,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          width: COL_PRODUCT_WIDTH,
                          minWidth: COL_PRODUCT_WIDTH,
                          verticalAlign: 'middle',
                        }}
                      >
                        {row.productName}
                      </Box>
                      {matrix.hourOptions.map((hour, idx) => {
                        const cell = row.cells[idx]
                        const x = cell?.x ?? 0
                        const y = cell?.y ?? 0
                        const z = cell?.z ?? null
                        const tone = pickCellTone(x, y)
                        const bg =
                          tone === 'red'
                            ? CELL_BG_RED
                            : tone === 'green'
                            ? CELL_BG_GREEN
                            : 'transparent'
                        const accent =
                          tone === 'red'
                            ? CELL_TEXT_RED
                            : tone === 'green'
                            ? CELL_TEXT_GREEN
                            : 'text.primary'
                        const interactive = editMode && canEdit
                        const displayZ = z && z.trim() ? z : '-'
                        return (
                          <Box
                            component="td"
                            key={hour.id}
                            onClick={() =>
                              handleCellClick(
                                row.learningLanguageId,
                                row.learningLanguageName,
                                row.productId,
                                row.productName,
                                hour.id,
                                hour.name,
                                y,
                                z
                              )
                            }
                            sx={{
                              borderRight: '1px solid',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              bgcolor: bg,
                              p: 1,
                              height: ROW_HEIGHT,
                              minWidth: COL_HOUR_WIDTH,
                              width: COL_HOUR_WIDTH,
                              verticalAlign: 'middle',
                              cursor: interactive ? 'pointer' : 'default',
                              transition: 'background-color 0.15s, box-shadow 0.15s',
                              '&:hover': interactive
                                ? {
                                    boxShadow: 'inset 0 0 0 2px rgba(24, 119, 242, 0.4)',
                                  }
                                : undefined,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.25,
                                lineHeight: 1.2,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, color: accent }}
                              >
                                {x}
                                <Box
                                  component="span"
                                  sx={{ color: 'text.disabled', fontWeight: 500, mx: 0.5 }}
                                >
                                  /
                                </Box>
                                {y}
                              </Typography>
                              <Tooltip
                                title={displayZ}
                                placement="top"
                                disableHoverListener={displayZ === '-'}
                                disableFocusListener={displayZ === '-'}
                                disableTouchListener={displayZ === '-'}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color:
                                      displayZ === '-' ? 'text.disabled' : 'text.secondary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {displayZ}
                                </Typography>
                              </Tooltip>
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Dialog open={noAccessOpen} onClose={() => setNoAccessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Доступ запрещён</DialogTitle>
        <DialogContent>
          <Typography variant="body2">У вас нету доступа к этому функционалу</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNoAccessOpen(false)}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={forbiddenAccessOpen}
        onClose={() => setForbiddenAccessOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Вы не имеете доступ к этому разделу
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setForbiddenAccessOpen(false)}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>

      <EditSlotDialog
        open={editTarget !== null}
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleSlotSaved}
      />
    </Box>
  )
}
