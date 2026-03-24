import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useSnackbar } from 'notistack'
import { getStudentDetail } from '../../entities/student/api'
import type { StudentDetail } from '../../entities/student/types'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ minWidth: 200, flex: '1 1 280px', mb: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
)

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getStudentDetail(Number(id))
      .then(setStudent)
      .catch((err) => {
        enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка загрузки', { variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [id])

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
        <Typography variant="h6" color="text.secondary">
          Ученик не найден
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/students')}>
          Назад к списку
        </Button>
      </Box>
    )
  }

  const curatorName = student.curatorLastName
    ? `${student.curatorLastName} ${student.curatorFirstName ?? ''}`.trim()
    : '—'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          sx={{ color: 'text.secondary' }}
        >
          Назад
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {student.lastName} {student.firstName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          (ID: {student.studentId})
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Основная информация
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Field label="Фамилия" value={student.lastName} />
          <Field label="Имя" value={student.firstName} />
          <Field label="Номер телефона" value={student.phoneNumber ? formatPhoneForUi(student.phoneNumber) : '—'} />
          <Field label="Класс" value={student.gradeName ?? '—'} />
          <Field label="Продукт" value={student.productName ?? '—'} />
          <Field label="Язык обучения" value={student.learningLanguageName ?? '—'} />
          <Field label="Офис" value={student.officeName ?? '—'} />
          <Field label="Время обучения" value={student.learningHourOptionName ?? '—'} />
          <Field label="Куратор" value={curatorName} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Часы и заморозки
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Field label="Гр. офф. часов" value={student.amountOfOfflineGroupHours} />
          <Field label="Инд. офф. часов" value={student.amountOfOfflineIndividualHours} />
          <Field label="Инд. онл. часов" value={student.amountOfOnlineIndividualHours} />
          <Field label="Заморозки" value={student.freezings} />
          <Field label="Дата начала обучения" value={student.offgrStartDate ?? '—'} />
        </Box>
      </Paper>
    </Box>
  )
}

export default StudentDetailPage
