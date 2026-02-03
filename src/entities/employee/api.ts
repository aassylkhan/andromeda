import { http } from '../../shared/api'
import type {
  Employee,
  EmployeeListItemDto,
  EmployeeCreateRequest,
  EmployeeCreateResultDto,
  UpdateEmployeeRequest,
  PageResponse,
  ApiErrorResponse,
} from './types'
import type { CreateEmployeeRequest } from './types'
import { EmployeesConflictError } from './types'
import { normalizePhoneDigits } from '../../shared/utils/phoneUtils'

interface AxiosErrorResponse {
  response?: {
    status: number
    data?: unknown
  }
}

// Helper to handle API errors consistently
function handleApiError(error: unknown, defaultMessage: string): never {
  const axiosError = error as AxiosErrorResponse
  // Handle 400 conflicts
  if (axiosError?.response?.status === 400) {
    const errorData = axiosError.response.data as ApiErrorResponse
    throw new EmployeesConflictError(
      errorData.message || defaultMessage,
      400,
      {
        userId: errorData.userId,
        existingUser: errorData.existingUser,
        conflictType: errorData.conflictType,
      }
    )
  }
  // Re-throw other errors with default message
  const message = (axiosError?.response?.data as { message?: string })?.message || 'Произошла непредвиденная ошибка'
  throw new Error(message)
}

interface GetEmployeesParams {
  page?: number
  size?: number
  q?: string
  roles?: string
  statuses?: string
}

type EmployeesResponse = PageResponse<EmployeeListItemDto> | PageResponse<Employee> | Employee[]

const normalizeEmployee = (employee: Employee): Employee => {
  return employee
}

const listItemToEmployee = (item: EmployeeListItemDto): Employee => {
  return {
    userId: item.userId,
    firstName: item.firstName,
    lastName: item.lastName,
    phoneNumber: item.phoneNumber,
    email: item.email,
    iin: item.pnOrIin ?? '',
    role: item.role,
    status: item.status,
  }
}

const normalizeEmployeesResponse = (data: EmployeesResponse): { items: Employee[]; total: number } => {
  if (Array.isArray(data)) {
    const items = data.map((e) => ('iin' in e ? normalizeEmployee(e as Employee) : listItemToEmployee(e as EmployeeListItemDto)))
    return { items, total: items.length }
  }

  const raw = data.content ?? []
  const items = raw.map((e) => ('iin' in e ? normalizeEmployee(e as Employee) : listItemToEmployee(e as EmployeeListItemDto)))
  const total = data.totalElements ?? items.length

  return { items, total }
}

export async function getEmployees(
  params?: GetEmployeesParams
): Promise<{ items: Employee[]; total: number }> {
  const { data } = await http.get<EmployeesResponse>('/api/v1/employees', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      ...(params?.q && { q: params.q }),
      ...(params?.roles && { roles: params.roles }),
      ...(params?.statuses && { statuses: params.statuses }),
    },
  })

  return normalizeEmployeesResponse(data)
}

export async function searchEmployees(params: {
  q: string
  roles?: string
  statuses?: string
  page?: number
  size?: number
}): Promise<{ items: Employee[]; total: number }> {
  const { data } = await http.get<EmployeesResponse>('/api/v1/employees', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      q: params.q,
      ...(params?.roles && { roles: params.roles }),
      ...(params?.statuses && { statuses: params.statuses }),
    },
  })

  return normalizeEmployeesResponse(data)
}

/** Map form CreateEmployeeRequest to API EmployeeCreateRequest */
export function toEmployeeCreateRequest(form: CreateEmployeeRequest): EmployeeCreateRequest {
  return {
    lastName: form.lastName,
    firstName: form.firstName,
    documentType: form.notCitizen ? 'PASSPORT' : 'ID_CARD',
    pnOrIin: form.notCitizen && !form.iin ? '000000000000' : form.iin,
    phoneNumber: form.phoneNumber,
    email: form.email,
    role: form.role,
  }
}

/**
 * Create new employee
 * POST /api/v1/employees
 * Payload should have phoneNumber as digits only (no +)
 */
export async function createEmployee(payload: EmployeeCreateRequest): Promise<EmployeeCreateResultDto> {
  try {
    const { data } = await http.post<EmployeeCreateResultDto>('/api/v1/employees', {
      ...payload,
      phoneNumber: normalizePhoneDigits(payload.phoneNumber),
      role: payload.role.toUpperCase(),
    })
    return data
  } catch (error: unknown) {
    handleApiError(error, 'Конфликт при добавлении сотрудника')
  }
}

/**
 * Take phone and create employee
 * POST /api/v1/employees/actions/take-phone-and-create?sourceUserId=...
 */
export async function takePhoneAndCreate(
  sourceUserId: number,
  payload: EmployeeCreateRequest
): Promise<Employee> {
  try {
    const { data } = await http.post<Employee>(
      '/api/v1/employees/actions/take-phone-and-create',
      {
        ...payload,
        phoneNumber: normalizePhoneDigits(payload.phoneNumber),
        role: payload.role.toUpperCase(),
      },
      {
        params: { sourceUserId },
      }
    )
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при создании с заимствованным номером')
  }
}

/**
 * Add user as employee
 * POST /api/v1/employees/actions/add-as-employee?userId=...&role=...
 */
export async function addAsEmployee(userId: number, role: string): Promise<Employee> {
  try {
    const { data } = await http.post<Employee>('/api/v1/employees/actions/add-as-employee', null, {
      params: {
        userId,
        role: role.toUpperCase(),
      },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при добавлении пользователя сотрудником')
  }
}

/**
 * Confirm existing user as employee (for conflicts)
 * POST /api/v1/employees/actions/add-as-employee?userId=...&role=...
 * Alias for addAsEmployee
 */
export const confirmExistingEmployee = addAsEmployee

/**
 * Update employee role
 * PATCH /api/v1/employees/{userId}/role?role=...
 */
export async function updateEmployeeRole(userId: number, role: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/role`, null, {
      params: { role: role.toUpperCase() },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении роли')
  }
}

/**
 * Update employee phone
 * PATCH /api/v1/employees/{userId}/phone?phone=...
 */
export async function updateEmployeePhone(userId: number, phone: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/phone`, null, {
      params: { phone: normalizePhoneDigits(phone) },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении номера телефона')
  }
}

/**
 * Take phone from another user
 * POST /api/v1/employees/{userId}/phone/take?sourceUserId=...&phone=...
 */
export async function takePhoneFrom(userId: number, sourceUserId: number, phone: string): Promise<Employee> {
  try {
    const { data } = await http.post<Employee>(`/api/v1/employees/${userId}/phone/take`, null, {
      params: {
        sourceUserId,
        phone: normalizePhoneDigits(phone),
      },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при заимствовании номера телефона')
  }
}

/**
 * Update employee email
 * PATCH /api/v1/employees/{userId}/email?email=...
 */
export async function updateEmployeeEmail(userId: number, email: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/email`, null, {
      params: { email },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении email')
  }
}

/**
 * Update employee (role, email). Calls updateEmployeeRole and updateEmployeeEmail as needed.
 */
export async function updateEmployee(userId: number, payload: UpdateEmployeeRequest): Promise<Employee> {
  if (payload.role != null && payload.email != null) {
    await updateEmployeeRole(userId, payload.role)
    return updateEmployeeEmail(userId, payload.email)
  }
  if (payload.role != null) return updateEmployeeRole(userId, payload.role)
  if (payload.email != null) return updateEmployeeEmail(userId, payload.email)
  throw new Error('Nothing to update')
}

/**
 * Update employee status
 * PATCH /api/v1/employees/{userId}/status?active=true|false
 */
export async function updateEmployeeStatus(userId: number, active: boolean): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/status`, null, {
      params: { active },
    })
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении статуса')
  }
}

/**
 * Assign user as head
 * PATCH /api/v1/employees/{userId}/assign-head
 */
export async function assignAsHead(userId: number): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(`/api/v1/employees/${userId}/assign-head`)
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при назначении руководителем')
  }
}
