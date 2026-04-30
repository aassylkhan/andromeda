import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLoginPage } from '../pages/AppLoginPage'
import { AppCodePage } from '../pages/AppCodePage'
import { AppSelectModePage } from '../pages/AppSelectModePage'
import { AppNoChildrenPage } from '../pages/AppNoChildrenPage'
import { AppProtectedRoute } from './AppProtectedRoute'
import { ParentLayout } from '../pages/parent/ParentLayout'
import { ParentPerformancePage } from '../pages/parent/ParentPerformancePage'
import { ParentSchedulePage } from '../pages/parent/ParentSchedulePage'
import { ParentFreezingPage } from '../pages/parent/ParentFreezingPage'
import { ParentMenuPage } from '../pages/parent/ParentMenuPage'
import { ParentSettingsPage } from '../pages/parent/ParentSettingsPage'
import { StudentLayout } from '../pages/student/StudentLayout'
import { StudentSchedulePage } from '../pages/student/StudentSchedulePage'
import { StudentResultsPage } from '../pages/student/StudentResultsPage'
import { StudentMatchmakingPage } from '../pages/student/StudentMatchmakingPage'
import { StudentMenuPage } from '../pages/student/StudentMenuPage'

/**
 * Root component for the app.andromeda.kz subdomain (parents/students).
 * Strictly separated from the employee CRM SPA; uses dedicated /api/v1/app-auth
 * endpoints and APP_PARENT / APP_STUDENT JWT modes.
 */
export const AppFrontendRoot: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public auth pages */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AppLoginPage />} />
      <Route path="/login/code" element={<AppCodePage />} />

      {/* Mode selection (BOTH parent + student users) */}
      <Route
        path="/select-mode"
        element={
          <AppProtectedRoute>
            <AppSelectModePage />
          </AppProtectedRoute>
        }
      />

      {/* Parent app */}
      <Route
        path="/parent/no-children"
        element={
          <AppProtectedRoute requiredModes={['APP_PARENT']}>
            <AppNoChildrenPage />
          </AppProtectedRoute>
        }
      />
      <Route
        path="/parent/settings"
        element={
          <AppProtectedRoute requiredModes={['APP_PARENT']}>
            <ParentSettingsPage />
          </AppProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <AppProtectedRoute requiredModes={['APP_PARENT']}>
            <ParentLayout />
          </AppProtectedRoute>
        }
      />
      <Route
        path="/parent/:studentId"
        element={
          <AppProtectedRoute requiredModes={['APP_PARENT']}>
            <ParentLayout />
          </AppProtectedRoute>
        }
      >
        <Route index element={<Navigate to="performance" replace />} />
        <Route path="performance" element={<ParentPerformancePage />} />
        <Route path="schedule" element={<ParentSchedulePage />} />
        <Route path="freezing" element={<ParentFreezingPage />} />
        <Route path="menu" element={<ParentMenuPage />} />
      </Route>

      {/* Student app */}
      <Route
        path="/student"
        element={
          <AppProtectedRoute requiredModes={['APP_STUDENT']}>
            <StudentLayout />
          </AppProtectedRoute>
        }
      >
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="schedule" element={<StudentSchedulePage />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="matchmaking" element={<StudentMatchmakingPage />} />
        <Route path="menu" element={<StudentMenuPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
)
