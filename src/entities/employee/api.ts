import { http } from '../../shared/api'
import type {
  Employee,
  EmployeeListItemDto,
  PageResponse,
  CreateEmployeeFromUserRequest,
  UpdateEmployeeRequest,
} from './types'

type EmployeesResponse = PageResponse<EmployeeListItemDto> | PageResponse<Employee> | Employee[]

interface GetEmployeesParams {
  page?: number
  size?: number
  q?: string
  roles?: string
  statuses?: string
  supervisors?: string
}

const listItemToEmployee = (item: EmployeeListItemDto): Employee => ({
  userId: item.userId,
  firstName: item.firstName,
  lastName: item.lastName,
  phoneNumber: item.phoneNumber,
  role: item.role,
  status: item.status,
  supervisorId: item.supervisorId,
  supervisorName: item.supervisorName,
})

function normalizeResponse(data: EmployeesResponse): { items: Employee[]; total: number } {
  if (Array.isArray(data)) {
    const items = data.map((e) =>
      'pnOrIin' in e ? listItemToEmployee(e as EmployeeListItemDto) : (e as Employee)
    )
    return { items, total: items.length }
  }
  const raw = data.content ?? []
  const items = raw.map((e) =>
    'pnOrIin' in e ? listItemToEmployee(e as EmployeeListItemDto) : (e as Employee)
  )
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
      ...(params?.supervisors && { supervisors: params.supervisors }),
    },
  })
  return normalizeResponse(data)
}

export async function createEmployeeFromUser(
  payload: CreateEmployeeFromUserRequest
): Promise<Employee> {
  try {
    const { data } = await http.post<Employee>('/api/v1/employees', {
      userId: payload.userId,
      role: payload.role.toUpperCase(),
      supervisorId: payload.supervisorId,
    })
    return data
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
): Promise<Employee> {
  const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}`, {
    ...(payload.role && { role: payload.role.toUpperCase() }),
    ...(payload.supervisorId && { supervisorId: payload.supervisorId }),
  })
  return data
}

export async function updateEmployeeStatus(userId: number, active: boolean): Promise<Employee> {
  const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/status`, null, {
    params: { active },
  })
  return data
}

export async function assignAsHead(userId: number): Promise<Employee> {
  const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/assign-head`)
  return data
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
