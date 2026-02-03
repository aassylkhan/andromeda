import { Navigate, createBrowserRouter } from 'react-router-dom'
import EmployeesPage from '../pages/employees/EmployeesPage'
import { MySessionsPage } from '../pages/MySessionsPage'
import { AllSessionsPage } from '../pages/AllSessionsPage'
import { LoginPage, CodePage } from '../features/auth-login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './layout/AppLayout'

export const router = createBrowserRouter([
  // Публичные маршруты авторизации
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/code',
    element: <CodePage />,
  },
  
  // Защищенные маршруты
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/employees" replace />,
      },
      {
        path: '/employees',
        element: (
          <ProtectedRoute requiredRoles={['head', 'director']}>
            <EmployeesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-sessions',
        element: <MySessionsPage />,
      },
      {
        path: '/sessions',
        element: <AllSessionsPage />,
      },
    ],
  },
  
  // Редирект всех неизвестных путей на /login
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
