import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage, CodePage } from '../features/auth-login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './layout/AppLayout'
import UsersPage from '../pages/users/UsersPage'
import EmployeesPage from '../pages/employees/EmployeesPage'
import { SessionsPage } from '../pages/SessionsPage'
import StudentsPage from '../pages/students/StudentsPage'
import StudentDetailPage from '../pages/students/StudentDetailPage'
import ParentsPage from '../pages/parents/ParentsPage'

const STUDENTS_PARENTS_ROLES = ['director', 'head', 'curator', 'expert']

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
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
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
        path: 'parents',
        element: (
          <ProtectedRoute requiredRoles={STUDENTS_PARENTS_ROLES} requiredSections={['parents']}>
            <ParentsPage />
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
