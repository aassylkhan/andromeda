import { http } from '../../shared/api'

export interface MaintenanceStatus {
  enabled: boolean
  resumeTime: string | null
  message: string | null
}

export async function getPlatformStatus(): Promise<MaintenanceStatus> {
  const { data } = await http.get<MaintenanceStatus>('/api/v1/platform-status')
  return data
}

export async function enableMaintenance(resumeTime: string, message?: string): Promise<MaintenanceStatus> {
  const { data } = await http.post<MaintenanceStatus>('/api/v1/admin/platform-status/maintenance-on', {
    resumeTime,
    message,
  })
  return data
}

export async function disableMaintenance(): Promise<MaintenanceStatus> {
  const { data } = await http.post<MaintenanceStatus>('/api/v1/admin/platform-status/maintenance-off')
  return data
}
