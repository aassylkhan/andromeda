import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Divider,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useSnackbar } from 'notistack'
import { getStudentDetail } from '../../entities/student/api'
import type { StudentDetail } from '../../entities/student/types'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { ParentsTab } from './tabs/ParentsTab'
import { EnrollStudentDialog } from '../../features/student-dialogs/EnrollStudentDialog'

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {value ?? '—'}
    </Typography>
  </Box>
)

const formatBalance = (val: number | null | undefined) => {
  if (val == null) return '0 ₸'
  return val.toLocaleString('ru-KZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₸'
}

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const [enrollOpen, setEnrollOpen] = useState(false)

  const loadStudent = useCallback(() => {
    if (!id) return
    setLoading(true)
    getStudentDetail(Number(id))
      .then(setStudent)
      .catch((err) => {
        enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка загрузки', { variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [id, enqueueSnackbar])

  useEffect(() => { loadStudent() }, [loadStudent])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  if (!student) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Ученик не найден</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/students')}>Назад к списку</Button>
      </Box>
    )
  }

  const curatorName = student.curatorLastName
    ? `${student.curatorLastName} ${student.curatorFirstName ?? ''}`.trim()
    : '—'

  const handleEnrollClick = () => {
    if (student.productId != null) {
      enqueueSnackbar('Данный ученик уже обучается', { variant: 'error' })
      return
    }
    setEnrollOpen(true)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')} sx={{ color: 'text.secondary' }}>
          Назад
        </Button>
      </Box>

      {/* Student Card */}
      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Photo */}
          <Avatar
            sx={{
              width: 120,
              height: 120,
              fontSize: 40,
              bgcolor: '#E3F2FD',
              color: '#1877F2',
              flexShrink: 0,
            }}
          >
            {(student.lastName?.[0] ?? '').toUpperCase()}{(student.firstName?.[0] ?? '').toUpperCase()}
          </Avatar>

          {/* Data Columns */}
          <Box sx={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {/* Column 1 */}
            <Box sx={{ minWidth: 200, flex: '1 1 240px' }}>
              <Field label="Фамилия и имя" value={`${student.lastName} ${student.firstName}`} />
              <Field label="ID" value={student.userId} />
              <Field label="Номер телефона" value={student.phoneNumber ? formatPhoneForUi(student.phoneNumber) : '—'} />
              <Field label="Номер документа" value={student.pnOrIin ?? '—'} />
              <Field label="Баланс" value={formatBalance(student.balance)} />
              <Field label="Кол. групповых оффлайн часов" value={student.amountOfOfflineGroupHours} />
              <Field label="Кол. индивидуальных оффлайн часов" value={student.amountOfOfflineIndividualHours} />
              <Field label="Кол. индивидуальных онлайн часов" value={student.amountOfOnlineIndividualHours} />
              <Field label="Кол. заморозок" value={student.freezings} />
            </Box>

            {/* Column 2 */}
            <Box sx={{ minWidth: 200, flex: '1 1 240px' }}>
              <Field label="Куратор" value={curatorName} />
              <Field label="Класс" value={student.gradeName ?? '—'} />
              <Field label="Продукт" value={student.productName ?? '—'} />
              <Field label="Язык обучения" value={student.learningLanguageName ?? '—'} />
              <Field label="Филиал" value={student.officeName ?? '—'} />
              <Field label="Время обучения" value={student.learningHourOptionName ?? '—'} />
              <Field label="Дата старта обучения" value={student.offerStartDate ?? '—'} />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handleEnrollClick}>
            Записать на обучение
          </Button>
        </Box>
      </Paper>

      {/* Tabs Zone */}
      <Paper variant="outlined" sx={{ bgcolor: '#fff', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{ borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 }}
        >
          <Tab label="Родители" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tabIndex === 0 && <ParentsTab studentId={student.studentId} />}
        </Box>
      </Paper>

      {/* Enrollment Dialog */}
      <EnrollStudentDialog
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        student={student}
        onSuccess={() => {
          setEnrollOpen(false)
          loadStudent()
        }}
      />
    </Box>
  )
}

export default StudentDetailPage
