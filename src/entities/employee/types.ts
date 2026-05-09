export type EmployeeRole = 'DIRECTOR' | 'HEAD' | 'ACCOUNTANT' | 'CURATOR' | 'TEACHER' | 'EXPERT'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type DocumentType = 'ID_CARD' | 'PASSPORT'

export interface Employee {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string | null
  role: EmployeeRole
  status: EmployeeStatus
  supervisorId?: number | null
  supervisorName?: string | null
}

export interface EmployeeListItemDto {
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
  role: EmployeeRole
  status: EmployeeStatus
  supervisorId?: number | null
  supervisorLastName?: string | null
  supervisorFirstName?: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

export interface CreateEmployeeFromUserRequest {
  userId: number
  role: string
  supervisorId: number
}

export interface UpdateEmployeeRequest {
  role: string
  supervisorId: number
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  DIRECTOR: 'Директор',
  HEAD: 'Руководитель',
  ACCOUNTANT: 'Бухгалтер',
  CURATOR: 'Куратор',
  TEACHER: 'Преподаватель',
  EXPERT: 'Эксперт',
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Активный',
  INACTIVE: 'Неактивный',
}

export const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: 'CURATOR', label: 'Куратор' },
  { value: 'TEACHER', label: 'Преподаватель' },
  { value: 'EXPERT', label: 'Эксперт' },
]

export interface TeacherRateItem {
  id: number
  createdAt: string
  createdByUserId: number
  createdByFullName: string
  subjectId: number
  subjectName: string
  rate: number
  activationDate: string
}

export interface SubjectDto {
  id: number
  name: string
}
