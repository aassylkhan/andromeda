import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Grid,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useSnackbar } from 'notistack'
import { getStudentDetail } from '../../entities/student/api'
import type { StudentDetail } from '../../entities/student/types'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
    {children}
  </Typography>
)

const Value: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
    {children}
  </Typography>
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

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Фамилия</Label>
            <Value>{student.lastName}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Имя</Label>
            <Value>{student.firstName}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Номер телефона</Label>
            <Value>{student.phoneNumber ? formatPhoneForUi(student.phoneNumber) : '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Класс</Label>
            <Value>{student.gradeName ?? '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Продукт</Label>
            <Value>{student.productName ?? '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Язык обучения</Label>
            <Value>{student.learningLanguageName ?? '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Офис</Label>
            <Value>{student.officeName ?? '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Время обучения</Label>
            <Value>{student.learningHourOptionName ?? '—'}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Куратор</Label>
            <Value>{curatorName}</Value>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Часы и заморозки
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Label>Гр. офф. часов</Label>
            <Value>{student.amountOfOfflineGroupHours}</Value>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Label>Инд. офф. часов</Label>
            <Value>{student.amountOfOfflineIndividualHours}</Value>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Label>Инд. онл. часов</Label>
            <Value>{student.amountOfOnlineIndividualHours}</Value>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Label>Заморозки</Label>
            <Value>{student.freezings}</Value>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Label>Дата начала обучения</Label>
            <Value>{student.offgrStartDate ?? '—'}</Value>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default StudentDetailPage
