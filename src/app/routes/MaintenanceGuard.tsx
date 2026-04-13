import React, { useState, useEffect } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { getPlatformStatus } from '../../entities/maintenance/api'
import MaintenancePage from '../../pages/maintenance/MaintenancePage'

interface MaintenanceGuardProps {
  children: React.ReactNode
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [resumeTime, setResumeTime] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    getPlatformStatus()
      .then((status) => {
        if (status.enabled) {
          setMaintenance(true)
          setResumeTime(status.resumeTime)
          setMessage(status.message)
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  if (maintenance) {
    return <MaintenancePage resumeTime={resumeTime} message={message} />
  }

  return <>{children}</>
}
