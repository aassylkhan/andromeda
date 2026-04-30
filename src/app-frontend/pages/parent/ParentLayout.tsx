import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, IconButton, Typography } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { BottomTabBar } from '../../components/BottomTabBar'
import type { BottomTab } from '../../components/BottomTabBar'
import { SwitchChildDialog } from '../../components/SwitchChildDialog'
import { AppShell } from '../../components/AppShell'
import { useParentChildrenStore } from '../../store/parentChildrenStore'

const SECTION_PATHS = ['performance', 'schedule', 'freezing', 'menu'] as const
type SectionPath = (typeof SECTION_PATHS)[number]

const SELECTED_KEY = 'app_parent_selectedStudentId'

export const ParentLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentId: studentIdParam } = useParams<{ studentId?: string }>()

  const { children: kids, loaded, loading, load } = useParentChildrenStore()
  const [switchOpen, setSwitchOpen] = useState(false)

  // Load children once
  useEffect(() => {
    if (!loaded && !loading) {
      void load()
    }
  }, [loaded, loading, load])

  const sectionPath: SectionPath = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    // /parent/:studentId/<section>
    const last = segments[segments.length - 1]
    if (SECTION_PATHS.includes(last as SectionPath)) {
      return last as SectionPath
    }
    return 'performance'
  }, [location.pathname])

  const studentIdFromUrl = useMemo(() => {
    const n = Number(studentIdParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [studentIdParam])

  // Pick default student: most recently linked (children list is already sorted DESC).
  // Fall back to last selected from localStorage.
  useEffect(() => {
    if (!loaded || studentIdFromUrl != null) return
    if (kids.length === 0) {
      navigate('/parent/no-children', { replace: true })
      return
    }
    const stored = Number(localStorage.getItem(SELECTED_KEY))
    const storedValid = kids.some((k) => k.studentId === stored)
    const sid = storedValid ? stored : kids[0].studentId
    navigate(`/parent/${sid}/${sectionPath}`, { replace: true })
  }, [loaded, kids, navigate, sectionPath, studentIdFromUrl])

  // If the URL's studentId is invalid (not in our list), fix it.
  useEffect(() => {
    if (!loaded || studentIdFromUrl == null) return
    if (kids.length === 0) {
      navigate('/parent/no-children', { replace: true })
      return
    }
    if (!kids.some((k) => k.studentId === studentIdFromUrl)) {
      const sid = kids[0].studentId
      navigate(`/parent/${sid}/${sectionPath}`, { replace: true })
    } else {
      localStorage.setItem(SELECTED_KEY, String(studentIdFromUrl))
    }
  }, [loaded, kids, studentIdFromUrl, navigate, sectionPath])

  const selectedStudent = useMemo(
    () => kids.find((k) => k.studentId === studentIdFromUrl) ?? null,
    [kids, studentIdFromUrl]
  )

  const handleSelectChild = (sid: number) => {
    setSwitchOpen(false)
    localStorage.setItem(SELECTED_KEY, String(sid))
    navigate(`/parent/${sid}/${sectionPath}`)
  }

  const tabs: BottomTab[] = useMemo(
    () =>
      studentIdFromUrl != null
        ? [
            {
              key: 'performance',
              label: 'Успеваемость',
              icon: <SchoolRoundedIcon fontSize="inherit" />,
              path: `/parent/${studentIdFromUrl}/performance`,
            },
            {
              key: 'schedule',
              label: 'Расписание',
              icon: <CalendarMonthRoundedIcon fontSize="inherit" />,
              path: `/parent/${studentIdFromUrl}/schedule`,
            },
            {
              key: 'freezing',
              label: 'Заморозка',
              icon: <AcUnitRoundedIcon fontSize="inherit" />,
              path: `/parent/${studentIdFromUrl}/freezing`,
            },
            {
              key: 'menu',
              label: 'Меню',
              icon: <MenuRoundedIcon fontSize="inherit" />,
              path: `/parent/${studentIdFromUrl}/menu`,
            },
          ]
        : [],
    [studentIdFromUrl]
  )

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {/* Header (NOT fixed per ТЗ) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(145,158,171,0.16)',
            bgcolor: '#FFFFFF',
            gap: 1,
          }}
        >
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setSwitchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSwitchOpen(true)
              }
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedStudent?.fullName ?? 'Выберите ученика'}
            </Typography>
            <KeyboardArrowDownRoundedIcon sx={{ color: '#637381' }} />
          </Box>

          <IconButton
            aria-label="Настройки"
            onClick={() => navigate('/parent/settings')}
            sx={{ color: '#637381' }}
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            pb: '88px', // space for fixed bottom tab bar
            bgcolor: '#FFFFFF',
          }}
        >
          <Outlet
            context={{
              studentId: studentIdFromUrl,
              student: selectedStudent,
            }}
          />
        </Box>

        <BottomTabBar tabs={tabs} />
      </Box>

      <SwitchChildDialog
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        loading={loading}
        children={kids}
        selectedStudentId={studentIdFromUrl}
        onSelect={handleSelectChild}
      />
    </AppShell>
  )
}
