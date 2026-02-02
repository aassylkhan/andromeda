import { http } from '../../shared/api'
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeCreateResultDto,
  ApiErrorResponse,
} from './types'
import { EmployeesConflictError } from './types'

interface AxiosErrorResponse {
  response?: {
    status: number
    data?: unknown
  }
}

/**
 * Handles API errors consistently across employee endpoints.
 * Converts 400/409 responses to EmployeesConflictError with conflict details.
 */
function handleApiError(error: unknown, defaultMessage: string): never {
  const axiosError = error as AxiosErrorResponse
  
  // Handle 400/409 conflicts with detailed error response
  if (axiosError?.response?.status === 400 || axiosError?.response?.status === 409) {
    const errorData = axiosError.response.data as ApiErrorResponse
    throw new EmployeesConflictError(
      errorData.message || defaultMessage,
      axiosError.response.status,
      {
        type: errorData.type,
        conflictUser: errorData.conflictUser,
        conflictType: errorData.conflictType,
      }
    )
  }
  
  // Re-throw other errors with default message
  const message = (axiosError?.response?.data as { message?: string })?.message || defaultMessage
  throw new Error(message)
}

interface GetEmployeesParams {
  page?: number
  size?: number
  q?: string
  roles?: string[]
  statuses?: string[]
}

type EmployeesResponse = {
  items?: Employee[]
  content?: Employee[]
  total?: number
  totalElements?: number
} | Employee[]

const normalizeEmployee = (employee: Employee): Employee => employee

const normalizeEmployeesResponse = (data: EmployeesResponse): { items: Employee[]; total: number } => {
  if (Array.isArray(data)) {
    return { items: data.map(normalizeEmployee), total: data.length }
  }

  const items = (data.items ?? data.content ?? []).map(normalizeEmployee)
  const total = data.total ?? data.totalElements ?? items.length

  return { items, total }
}

// ============================================================================
// SPEC: GET /api/v1/employees (листинг + поиск + фильтр)
// ============================================================================

/**
 * Get employees list with optional search and filters.
 * 
 * @param params.page - 0-based page number (default 0)
 * @param params.size - page size (default 20)
 * @param params.q - search query (searches userId, phone, pn_or_iin, email, names)
 * @param params.roles - array of roles to filter (mentor, teacher, expert, accountant, head, director)
 * @param params.statuses - array of statuses to filter (ACTIVE, INACTIVE)
 */
export async function getEmployees(
  params?: GetEmployeesParams
): Promise<{ items: Employee[]; total: number }> {
  const { data } = await http.get<EmployeesResponse>('/api/v1/employees', {
    params,
  })

  return normalizeEmployeesResponse(data)
}

// ============================================================================
// SPEC: POST /api/v1/employees (попытка добавить сотрудника)
// ============================================================================

/**
 * Create employee. Returns EmployeeCreateResultDto with conflict details if applicable.
 * 
 * Possible result types:
 * - CREATED: employee created successfully
 * - PHONE_TAKEN: phone is taken by another user (conflictUser provided)
 * - EMAIL_TAKEN: email is taken (conflictUser provided)
 * - USER_EXISTS_NOT_EMPLOYEE: user exists but is not an employee (conflictUser provided)
 * - EMPLOYEE_ALREADY_EXISTS: employee already exists (conflictUser provided)
 */
export async function createEmployee(
  payload: CreateEmployeeRequest
): Promise<EmployeeCreateResultDto> {
  try {
    const { data } = await http.post<EmployeeCreateResultDto>('/api/v1/employees', {
      lastName: payload.lastName,
      firstName: payload.firstName,
      documentType: payload.documentType,
      pnOrIin: payload.pnOrIin,
      phoneNumber: payload.phoneNumber, // only digits, no "+"
      email: payload.email,
      role: payload.role.toUpperCase(),
    })
    return data
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при создании сотрудника')
  }
}

// ============================================================================
// SPEC: POST /api/v1/employees/actions/take-phone-and-create
// ============================================================================

/**
 * Create employee by taking phone from another user (sourceUserId).
 * Called when POST /api/v1/employees returns PHONE_TAKEN.
 */
export async function takePhoneAndCreate(
  sourceUserId: number,
  payload: CreateEmployeeRequest
): Promise<EmployeeCreateResultDto> {
  try {
    const { data } = await http.post<EmployeeCreateResultDto>(
      '/api/v1/employees/actions/take-phone-and-create',
      {
        lastName: payload.lastName,
        firstName: payload.firstName,
        documentType: payload.documentType,
        pnOrIin: payload.pnOrIin,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        role: payload.role.toUpperCase(),
      },
      {
        params: { sourceUserId },
      }
    )
    return data
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при создании сотрудника с отобранием номера')
  }
}

// ============================================================================
// SPEC: POST /api/v1/employees/actions/add-as-employee
// ============================================================================

/**
 * Add existing user as employee.
 * Called when POST /api/v1/employees returns USER_EXISTS_NOT_EMPLOYEE.
 */
export async function addAsEmployee(
  userId: number,
  role: string
): Promise<EmployeeCreateResultDto> {
  try {
    const { data } = await http.post<EmployeeCreateResultDto>(
      '/api/v1/employees/actions/add-as-employee',
      null,
      {
        params: {
          userId,
          role: role.toUpperCase(),
        },
      }
    )
    return data
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при добавлении пользователя как сотрудника')
  }
}

// ============================================================================
// SPEC: PATCH /api/v1/employees/{userId}/role
// ============================================================================

/**
 * Update employee role.
 * Note: cannot set HEAD role via this endpoint (returns error).
 */
export async function editRole(userId: number, role: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(
      `/api/v1/employees/${userId}/role`,
      null,
      {
        params: { role: role.toUpperCase() },
      }
    )
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении роли')
  }
}

// ============================================================================
// SPEC: PATCH /api/v1/employees/{userId}/phone
// ============================================================================

/**
 * Update employee phone number.
 * Returns 200 on success, or 409 if phone is taken (conflictUser provided).
 */
export async function editPhone(userId: number, phone: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(
      `/api/v1/employees/${userId}/phone`,
      null,
      {
        params: { phone }, // only digits, no "+"
      }
    )
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении номера телефона')
  }
}

// ============================================================================
// SPEC: POST /api/v1/employees/{userId}/phone/take
// ============================================================================

/**
 * Take phone from another user and assign to current employee.
 * Called when PATCH /api/v1/employees/{userId}/phone returns 409 PHONE_TAKEN.
 */
export async function takePhone(
  userId: number,
  sourceUserId: number,
  phone: string
): Promise<void> {
  try {
    await http.post(
      `/api/v1/employees/${userId}/phone/take`,
      null,
      {
        params: {
          sourceUserId,
          phone, // only digits, no "+"
        },
      }
    )
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при отобрании номера телефона')
  }
}

// ============================================================================
// SPEC: PATCH /api/v1/employees/{userId}/email
// ============================================================================

/**
 * Update employee email.
 * Returns 200 on success, or 409 if email is taken.
 */
export async function editEmail(userId: number, email: string): Promise<Employee> {
  try {
    const { data } = await http.patch<Employee>(
      `/api/v1/employees/${userId}/email`,
      null,
      {
        params: { email },
      }
    )
    return normalizeEmployee(data)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении email')
  }
}

// ============================================================================
// SPEC: PATCH /api/v1/employees/{userId}/status
// ============================================================================

/**
 * Update employee status (activate/deactivate).
 */
export async function setStatus(userId: number, active: boolean): Promise<void> {
  try {
    await http.patch(
      `/api/v1/employees/${userId}/status`,
      null,
      {
        params: { active },
      }
    )
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при обновлении статуса')
  }
}

// ============================================================================
// SPEC: PATCH /api/v1/employees/{userId}/assign-head
// ============================================================================

/**
 * Assign employee as HEAD (only DIRECTOR role can do this).
 * Returns 403 if insufficient permissions.
 */
export async function assignHead(userId: number): Promise<void> {
  try {
    await http.patch(`/api/v1/employees/${userId}/assign-head`, null)
  } catch (error: unknown) {
    handleApiError(error, 'Ошибка при назначении руководителем')
  }
}
