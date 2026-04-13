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
  Select,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined'
import { useSnackbar } from 'notistack'
import { useAuthStore } from '../../entities/auth'
import { getOffices } from '../../entities/lookup/api'
import {
  getClassrooms,
  getGroups,
} from '../../entities/schedule/api'
import type { ClassroomDto, GroupListItemDto } from '../../entities/schedule/types'
import type { LookupDto } from '../../entities/lookup/types'
import { hasAnyRole } from '../../shared/utils/roleUtils'
import { CreateGroupDialog } from '../../features/schedule-dialogs/CreateGroupDialog'
import { EditGroupDialog } from '../../features/schedule-dialogs/EditGroupDialog'
import { ScheduleFilterDialog } from '../../features/schedule-dialogs/ScheduleFilterDialog'

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] as const
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 7; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  slots.push('23:00')
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const GROUP_TYPE_COLORS: Record<number, string> = {
  1: '#1877F2',
  2: '#8E33FF',
}

export interface ScheduleFilter {
  groupTypeIds: number[]
  subjectIds: number[]
  teacherIds: number[]
  studentsFrom: number | null
  studentsTo: number | null
}

const EMPTY_FILTER: ScheduleFilter = {
  groupTypeIds: [],
  subjectIds: [],
  teacherIds: [],
  studentsFrom: null,
  studentsTo: null,
}

export default function OfflineSchedulePage() {
  const { enqueueSnackbar } = useSnackbar()
  const user = useAuthStore((s) => s.user)

  const [offices, setOffices] = useState<LookupDto[]>([])
  const [selectedOfficeId, setSelectedOfficeId] = useState<number>(1)
  const [classrooms, setClassrooms] = useState<ClassroomDto[]>([])
  const [groups, setGroups] = useState<GroupListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ScheduleFilter>(EMPTY_FILTER)

  const [createOpen, setCreateOpen] = useState(false)
  const [editGroupId, setEditGroupId] = useState<number | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [noAccessOpen, setNoAccessOpen] = useState(false)

  const canManageGroups = useMemo(
    () => hasAnyRole(user, ['head', 'director']),
    [user]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [officesData, classroomsData, groupsData] = await Promise.all([
        getOffices(),
        getClassrooms(selectedOfficeId),
        getGroups({
          officeId: selectedOfficeId,
          groupTypeIds: filter.groupTypeIds.length ? filter.groupTypeIds : undefined,
          subjectIds: filter.subjectIds.length ? filter.subjectIds : undefined,
          teacherIds: filter.teacherIds.length ? filter.teacherIds : undefined,
          studentsFrom: filter.studentsFrom ?? undefined,
          studentsTo: filter.studentsTo ?? undefined,
        }),
      ])
      setOffices(officesData)
      setClassrooms(classroomsData)
      setGroups(groupsData)
    } catch {
      enqueueSnackbar('Ошибка загрузки расписания', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [selectedOfficeId, filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddClick = () => {
    if (!canManageGroups) {
      setNoAccessOpen(true)
      return
    }
    setCreateOpen(true)
  }

  const handleGroupClick = (groupId: number) => {
    if (!canManageGroups) {
      setNoAccessOpen(true)
      return
    }
    setEditGroupId(groupId)
  }

  const handleGroupCreated = () => {
    setCreateOpen(false)
    loadData()
  }

  const handleGroupUpdated = () => {
    setEditGroupId(null)
    loadData()
  }

  const handleGroupDeleted = () => {
    setEditGroupId(null)
    loadData()
  }

  const handleFilterApply = (newFilter: ScheduleFilter) => {
    setFilter(newFilter)
    setFilterOpen(false)
  }

  const handleFilterReset = () => {
    setFilter(EMPTY_FILTER)
    setFilterOpen(false)
  }

  const getDayValue = (g: GroupListItemDto, dayKey: string): boolean => {
    switch (dayKey) {
      case 'mon': return g.mon
      case 'tue': return g.tue
      case 'wed': return g.wed
      case 'thu': return g.thu
      case 'fri': return g.fri
      case 'sat': return g.sat
      case 'sun': return g.sun
      default: return false
    }
  }

  const groupsInCell = useCallback(
    (classroomId: number, dayKey: string, timeSlot: string) => {
      return groups.filter((g) => {
        if (g.classroomId !== classroomId) return false
        if (!getDayValue(g, dayKey)) return false
        const startStr = g.startTime.substring(0, 5)
        return startStr === timeSlot
      })
    },
    [groups]
  )

  const groupSpansSlots = useCallback((g: GroupListItemDto): number => {
    const [sh, sm] = g.startTime.split(':').map(Number)
    const [eh, em] = g.endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    return Math.max(1, Math.ceil((endMin - startMin) / 30))
  }, [])

  const occupiedCells = useMemo(() => {
    const set = new Set<string>()
    for (const g of groups) {
      const spans = groupSpansSlots(g)
      for (const dayKey of DAY_KEYS) {
        if (!getDayValue(g, dayKey)) continue
        const startIdx = TIME_SLOTS.indexOf(g.startTime.substring(0, 5))
        if (startIdx < 0) continue
        for (let i = 1; i < spans; i++) {
          const idx = startIdx + i
          if (idx < TIME_SLOTS.length) {
            set.add(`${g.classroomId}-${dayKey}-${TIME_SLOTS[idx]}`)
          }
        }
      }
    }
    return set
  }, [groups, groupSpansSlots])

  const CELL_HEIGHT = 48
  const STICKY_COL_WIDTH_DAY = 50
  const STICKY_COL_WIDTH_TIME = 60
  const CLASSROOM_COL_WIDTH = 180

  if (loading && offices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Оффлайн расписание
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
            Добавить
          </Button>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(true)}>
            Фильтр
          </Button>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Филиал</InputLabel>
            <Select
              value={selectedOfficeId}
              label="Филиал"
              onChange={(e) => setSelectedOfficeId(Number(e.target.value))}
            >
              {offices.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<MeetingRoomOutlinedIcon />} disabled>
            Кабинеты
          </Button>
        </Box>
      </Box>

      {/* Schedule grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : classrooms.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Нет кабинетов для выбранного филиала
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Добавьте кабинеты, чтобы увидеть расписание
          </Typography>
        </Box>
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
            }}
          >
            {/* Header row with classroom names */}
            <Box component="thead">
              <Box component="tr">
                <Box
                  component="th"
                  sx={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    zIndex: 4,
                    width: STICKY_COL_WIDTH_DAY,
                    minWidth: STICKY_COL_WIDTH_DAY,
                    bgcolor: '#F4F6F8',
                    borderBottom: '2px solid',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  День
                </Box>
                <Box
                  component="th"
                  sx={{
                    position: 'sticky',
                    top: 0,
                    left: STICKY_COL_WIDTH_DAY,
                    zIndex: 4,
                    width: STICKY_COL_WIDTH_TIME,
                    minWidth: STICKY_COL_WIDTH_TIME,
                    bgcolor: '#F4F6F8',
                    borderBottom: '2px solid',
                    borderRight: '2px solid',
                    borderColor: 'divider',
                    p: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  Время
                </Box>
                {classrooms.map((cr) => (
                  <Box
                    component="th"
                    key={cr.id}
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      width: CLASSROOM_COL_WIDTH,
                      minWidth: CLASSROOM_COL_WIDTH,
                      bgcolor: '#F4F6F8',
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
                    {cr.name}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Body: day + time rows */}
            <Box component="tbody">
              {DAYS.map((dayLabel, dayIdx) => {
                const dayKey = DAY_KEYS[dayIdx]
                return TIME_SLOTS.map((timeSlot, timeIdx) => {
                  const isFirstTimeOfDay = timeIdx === 0
                  const cellKey = `${dayKey}-${timeSlot}`

                  return (
                    <Box component="tr" key={cellKey}>
                      {/* Day cell - only for first time slot */}
                      {isFirstTimeOfDay && (
                        <Box
                          component="td"
                          rowSpan={TIME_SLOTS.length}
                          sx={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            bgcolor: '#F4F6F8',
                            borderRight: '1px solid',
                            borderBottom: '2px solid',
                            borderColor: 'divider',
                            p: 0.5,
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: 'text.primary',
                            verticalAlign: 'top',
                            pt: 1,
                            writingMode: 'vertical-lr',
                            textOrientation: 'mixed',
                            letterSpacing: 2,
                          }}
                        >
                          {dayLabel}
                        </Box>
                      )}
                      {/* Time cell */}
                      <Box
                        component="td"
                        sx={{
                          position: 'sticky',
                          left: STICKY_COL_WIDTH_DAY,
                          zIndex: 2,
                          bgcolor: '#F9FAFB',
                          borderRight: '2px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          p: 0.5,
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          fontWeight: 500,
                          height: CELL_HEIGHT,
                          ...(timeIdx === TIME_SLOTS.length - 1 && {
                            borderBottom: '2px solid',
                          }),
                        }}
                      >
                        {timeSlot}
                      </Box>
                      {/* Classroom cells */}
                      {classrooms.map((cr) => {
                        const key = `${cr.id}-${dayKey}-${timeSlot}`
                        if (occupiedCells.has(key)) return null

                        const cellGroups = groupsInCell(cr.id, dayKey, timeSlot)

                        if (cellGroups.length > 0) {
                          const g = cellGroups[0]
                          const spans = groupSpansSlots(g)
                          return (
                            <Box
                              component="td"
                              key={key}
                              rowSpan={spans}
                              sx={{
                                borderRight: '1px solid',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                p: 0,
                                verticalAlign: 'top',
                                height: CELL_HEIGHT * spans,
                                position: 'relative',
                              }}
                            >
                              <Box
                                onClick={() => handleGroupClick(g.id)}
                                sx={{
                                  position: 'absolute',
                                  inset: 2,
                                  borderRadius: 1,
                                  bgcolor: 'background.paper',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  transition: 'box-shadow 0.15s',
                                  '&:hover': {
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                  },
                                }}
                              >
                                {/* Color stripe */}
                                <Box
                                  sx={{
                                    width: 4,
                                    minWidth: 4,
                                    bgcolor: GROUP_TYPE_COLORS[g.groupTypeId] ?? '#919EAB',
                                    borderRadius: '4px 0 0 4px',
                                  }}
                                />
                                {/* Content */}
                                <Box sx={{ flex: 1, p: 0.75, overflow: 'hidden', position: 'relative' }}>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 700, display: 'block', lineHeight: 1.2, mb: 0.25 }}
                                    noWrap
                                  >
                                    {g.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', lineHeight: 1.2, mb: 0.25 }}
                                    noWrap
                                  >
                                    {g.teacherName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', lineHeight: 1.2 }}
                                    noWrap
                                  >
                                    {g.subjectName}
                                  </Typography>
                                  {/* Student count badge */}
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: GROUP_TYPE_COLORS[g.groupTypeId] ?? '#919EAB',
                                      color: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {g.studentCount}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          )
                        }

                        return (
                          <Box
                            component="td"
                            key={key}
                            sx={{
                              borderRight: '1px solid',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              height: CELL_HEIGHT,
                              ...(timeIdx === TIME_SLOTS.length - 1 && {
                                borderBottom: '2px solid',
                              }),
                            }}
                          />
                        )
                      })}
                    </Box>
                  )
                })
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* No access dialog */}
      <Dialog open={noAccessOpen} onClose={() => setNoAccessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Доступ запрещён</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Вы не можете создавать группы</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNoAccessOpen(false)}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create group dialog */}
      {createOpen && (
        <CreateGroupDialog
          open={createOpen}
          defaultOfficeId={selectedOfficeId}
          onClose={() => setCreateOpen(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {/* Edit group dialog */}
      {editGroupId !== null && (
        <EditGroupDialog
          open={editGroupId !== null}
          groupId={editGroupId}
          onClose={() => setEditGroupId(null)}
          onUpdated={handleGroupUpdated}
          onDeleted={handleGroupDeleted}
        />
      )}

      {/* Filter dialog */}
      <ScheduleFilterDialog
        open={filterOpen}
        filter={filter}
        onClose={() => setFilterOpen(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </Box>
  )
}
