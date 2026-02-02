import { isEmployeesConflictError } from '../../entities/employee'
import type { EmployeeCreateResultType, ConflictUserDto } from '../../entities/employee'

export type ConflictScenario = 
  | 'CREATED'
  | 'PHONE_TAKEN'
  | 'EMAIL_TAKEN'
  | 'USER_EXISTS_NOT_EMPLOYEE'
  | 'EMPLOYEE_ALREADY_EXISTS'
  | 'UNKNOWN'

/**
 * Determines the conflict scenario based on error/response details.
 * Priority: 1. type field 2. message substring matching 3. unknown
 */
export function determineConflictScenario(error: unknown): ConflictScenario {
  if (!isEmployeesConflictError(error)) {
    return 'UNKNOWN'
  }

  // Priority 1: Use type if provided
  if (error.type) {
    return error.type as ConflictScenario
  }

  // Priority 2: Fallback to message matching (for backwards compatibility)
  const message = error.message || ''
  if (message.includes('PHONE_TAKEN') || message.includes('номер занят')) {
    return 'PHONE_TAKEN'
  }
  if (message.includes('EMAIL_TAKEN') || message.includes('email занят')) {
    return 'EMAIL_TAKEN'
  }
  if (message.includes('USER_EXISTS') || message.includes('пользователь')) {
    return 'USER_EXISTS_NOT_EMPLOYEE'
  }
  if (message.includes('EMPLOYEE_ALREADY_EXISTS') || message.includes('Сотрудник')) {
    return 'EMPLOYEE_ALREADY_EXISTS'
  }

  return 'UNKNOWN'
}

/**
 * Checks if error has valid conflict user data for dialog display
 */
export function hasValidConflictUserData(error: unknown): error is {
  conflictUser?: ConflictUserDto
} & InstanceType<typeof Error> {
  if (!isEmployeesConflictError(error)) {
    return false
  }
  return !!(
    error.conflictUser?.id &&
    error.conflictUser?.firstName &&
    error.conflictUser?.lastName
  )
}

/**
 * Type guard for old API (backwards compatibility)
 */
export function hasValidExistingUserData(error: unknown): boolean {
  return hasValidConflictUserData(error)
}
