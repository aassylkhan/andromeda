import { http } from '../../shared/api'
import type {
  Employee,
  EmployeeListItemDto,
  PageResponse,
  CreateEmployeeFromUserRequest,
  UpdateEmployeeRequest,
} from './types'

type EmployeesResponse = PageResponse<EmployeeListItemDto>

interface GetEmployeesParams {
  page?: number
  size?: number
  q?: string
  roles?: string
  statuses?: string
  supervisorIds?: string
}

const listItemToEmployee = (item: EmployeeListItemDto): Employee => ({
  userId: item.userId,
  firstName: item.firstName,
  lastName: item.lastName,
  phoneNumber: item.phoneNumber,
  role: item.role,
  status: item.status,
  supervisorId: item.supervisorId,
  supervisorName:
    [item.supervisorLastName, item.supervisorFirstName].filter(Boolean).join(' ') || null,
})

function normalizeResponse(data: EmployeesResponse): { items: Employee[]; total: number } {
  const raw = data.content ?? []
  const items = raw.map(listItemToEmployee)
  return { items, total: data.totalElements ?? items.length }
}

export async function getEmployees(
  params?: GetEmployeesParams
): Promise<{ items: Employee[]; total: number }> {
  const { data } = await http.get<EmployeesResponse>('/api/v1/employees', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.q && { q: params.q }),
      ...(params?.roles && { roles: params.roles }),
      ...(params?.statuses && { statuses: params.statuses }),
      ...(params?.supervisorIds && { supervisorIds: params.supervisorIds }),
    },
  })
  return normalizeResponse(data)
}

export async function createEmployeeFromUser(
  payload: CreateEmployeeFromUserRequest
): Promise<void> {
  try {
    await http.post('/api/v1/employees', {
      userId: payload.userId,
      role: payload.role.toUpperCase(),
      supervisorId: payload.supervisorId,
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || 'Ошибка при добавлении сотрудника'
    const status = error?.response?.status
    if (status === 409) {
      throw new EmployeeAlreadyExistsError(msg)
    }
    throw new Error(msg)
  }
}

export async function updateEmployee(
  userId: number,
  payload: UpdateEmployeeRequest
): Promise<void> {
  await http.put(`/api/v1/employees/${userId}`, {
    role: payload.role.toUpperCase(),
    supervisorId: payload.supervisorId,
  })
}

export async function updateEmployeeStatus(userId: number): Promise<void> {
  await http.patch(`/api/v1/employees/${userId}/toggle-status`)
}

export async function assignAsHead(userId: number): Promise<void> {
  await http.patch(`/api/v1/employees/${userId}/assign-head`)
}

export async function getSupervisors(): Promise<Employee[]> {
  const result = await getEmployees({ roles: 'DIRECTOR,HEAD', statuses: 'ACTIVE', size: 100 })
  return result.items
}

export class EmployeeAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmployeeAlreadyExistsError'
  }
}

// ==================== Teacher Rates ====================

import type { TeacherRateItem, SubjectDto } from './types'

export async function getTeacherRates(teacherUserId: number): Promise<TeacherRateItem[]> {
  const { data } = await http.get<TeacherRateItem[]>(`/api/v1/employees/${teacherUserId}/rates`)
  return data
}

export async function createTeacherRate(
  teacherUserId: number,
  payload: { subjectId: number; rate: number; activationDate: string }
): Promise<TeacherRateItem> {
  const { data } = await http.post<TeacherRateItem>(`/api/v1/employees/${teacherUserId}/rates`, payload)
  return data
}

export async function getSubjects(teacherUserId: number): Promise<SubjectDto[]> {
  const { data } = await http.get<SubjectDto[]>(`/api/v1/employees/${teacherUserId}/rates/subjects`)
  return data
}
