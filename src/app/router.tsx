import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage, CodePage } from '../features/auth-login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { MaintenanceGuard } from './routes/MaintenanceGuard'
import { AppLayout } from './layout/AppLayout'
import UsersPage from '../pages/users/UsersPage'
import EmployeesPage from '../pages/employees/EmployeesPage'
import { SessionsPage } from '../pages/SessionsPage'
import StudentsPage from '../pages/students/StudentsPage'
import StudentDetailPage from '../pages/students/StudentDetailPage'
import CuratorAssignmentPage from '../pages/students/CuratorAssignmentPage'
import ParentsPage from '../pages/parents/ParentsPage'
import AccountingPage from '../pages/accounting/AccountingPage'
import OfflineSchedulePage from '../pages/schedule/OfflineSchedulePage'
import SlotsPage from '../pages/slots/SlotsPage'
import ReferralProgramPage from '../pages/referral/ReferralProgramPage'

const STUDENTS_PARENTS_ROLES = ['director', 'head', 'curator', 'expert']
const ACCOUNTING_ROLES = ['director', 'head', 'accountant', 'expert', 'curator']
const SLOTS_ROLES = ['director', 'head', 'curator', 'expert']

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/code',
    element: <CodePage />,
  },
  {
    path: '/',
    element: (
      <MaintenanceGuard>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </MaintenanceGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/sessions" replace />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredRoles={['director', 'head', 'accountant', 'curator', 'expert']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute requiredRoles={['director', 'head']}>
            <EmployeesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute requiredRoles={STUDENTS_PARENTS_ROLES} requiredSections={['students']}>
            <StudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id',
        element: (
          <ProtectedRoute requiredRoles={STUDENTS_PARENTS_ROLES} requiredSections={['students']}>
            <StudentDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/without-curator',
        element: (
          <ProtectedRoute requiredRoles={['director', 'head']}>
            <CuratorAssignmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'parents',
        element: (
          <ProtectedRoute requiredRoles={STUDENTS_PARENTS_ROLES} requiredSections={['parents']}>
            <ParentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'accounting',
        element: (
          <ProtectedRoute requiredRoles={ACCOUNTING_ROLES} requiredSections={['accounting']}>
            <AccountingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payment-requests',
        element: <Navigate to="/accounting" replace />,
      },
      {
        path: 'offline-schedule',
        element: (
          <ProtectedRoute requiredSections={['offlineSchedule']}>
            <OfflineSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'slots',
        element: (
          <ProtectedRoute requiredRoles={SLOTS_ROLES} requiredSections={['slots']}>
            <SlotsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'referral',
        element: (
          <ProtectedRoute requiredSections={['referralProgram']}>
            <ReferralProgramPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions',
        element: <SessionsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
