import { isEmployeesConflictError } from '../../entities/employee'
import type { ConflictType } from '../../entities/employee'

export type ConflictScenario = ConflictType | 'UNKNOWN'

/**
 * Determines the conflict scenario based on error details
 * Priority: 1. conflictType field 2. message substring matching 3. unknown
 */
export function determineConflictScenario(error: unknown): ConflictScenario {
  if (!isEmployeesConflictError(error)) {
    return 'UNKNOWN'
  }

  // Priority 1: Use conflictType if provided
  if (error.conflictType) {
    return error.conflictType
  }

  // Priority 2: Fallback to message matching
  const message = error.message || ''
  if (message.includes('Пользователь с таким номером')) {
    return 'USER_EXISTS'
  }
  if (message.includes('Сотрудник с таким номером')) {
    return 'EMPLOYEE_EXISTS'
  }

  return 'UNKNOWN'
}

/**
 * Checks if error has valid existing user data for dialog display
 */
export function hasValidExistingUserData(error: unknown): boolean {
  if (!isEmployeesConflictError(error)) {
    return false
  }
  return !!(error.existingUser?.userId && error.existingUser?.firstName && error.existingUser?.lastName)
}
