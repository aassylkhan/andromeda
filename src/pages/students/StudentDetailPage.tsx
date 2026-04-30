import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { TransactionsTab } from './tabs/TransactionsTab'
import { AccrualsTab } from './tabs/AccrualsTab'
import { EnrollStudentDialog } from '../../features/student-dialogs/EnrollStudentDialog'
import { PurchaseHoursDialog } from '../../features/student-dialogs/PurchaseHoursDialog'
import { ExtensionRequestDialog } from '../../features/student-dialogs/ExtensionRequestDialog'

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
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [extensionOpen, setExtensionOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const requestIdRef = useRef(0)

  const loadStudent = useCallback(() => {
    if (!id) return
    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    getStudentDetail(Number(id))
      .then((data) => {
        if (requestIdRef.current === currentRequestId) {
          setStudent(data)
        }
      })
      .catch((err) => {
        if (requestIdRef.current === currentRequestId) {
          enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка загрузки', { variant: 'error' })
        }
      })
      .finally(() => {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false)
        }
      })
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

  const handleExtensionClick = () => {
    if (student.productId == null) {
      enqueueSnackbar(
        'У ученика не назначен продукт обучения, расчёт пролонгации невозможен',
        { variant: 'error' }
      )
      return
    }
    setExtensionOpen(true)
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
          <Button variant="contained" color="secondary" onClick={() => setPurchaseOpen(true)}>
            Купить часы
          </Button>
          <Button variant="outlined" color="primary" onClick={handleExtensionClick}>
            Пролонгация
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
          <Tab label="Транзакции" />
          <Tab label="Начисления" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tabIndex === 0 && <ParentsTab studentId={student.studentId} />}
          {tabIndex === 1 && <TransactionsTab studentId={student.studentId} refreshKey={refreshKey} />}
          {tabIndex === 2 && (
            <AccrualsTab
              studentId={student.studentId}
              refreshKey={refreshKey}
              onConvertSuccess={() => {
                setRefreshKey((k) => k + 1)
                loadStudent()
              }}
            />
          )}
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

      {/* Purchase Hours Dialog */}
      <PurchaseHoursDialog
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        student={student}
        onSuccess={() => {
          setPurchaseOpen(false)
          setRefreshKey((k) => k + 1)
          loadStudent()
        }}
      />

      {/* Extension Request Dialog (Пролонгация) */}
      <ExtensionRequestDialog
        open={extensionOpen}
        onClose={() => setExtensionOpen(false)}
        student={student}
        onSuccess={() => setExtensionOpen(false)}
      />
    </Box>
  )
}

export default StudentDetailPage
