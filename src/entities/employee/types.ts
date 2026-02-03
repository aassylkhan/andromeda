export type EmployeeRole = 'EXPERT' | 'MENTOR' | 'TEACHER' | 'ACCOUNTANT' | 'HEAD' | 'DIRECTOR' | 'ADMIN'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type DocumentType = 'ID_CARD' | 'PASSPORT'
export type CreateResultType = 'CREATED' | 'PHONE_TAKEN' | 'EMAIL_TAKEN' | 'USER_EXISTS_NOT_EMPLOYEE' | 'EMPLOYEE_ALREADY_EXISTS'

export type ConflictType = 'USER_EXISTS' | 'EMPLOYEE_EXISTS'

export type Employee = {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string | null
  email: string | null
  iin: string
  role: EmployeeRole
  status: EmployeeStatus
  preferredLanguage?: string | null
  createdAt?: string
}

export type EmployeeListItemDto = {
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
  pnOrIin: string | null
  email: string | null
  role: EmployeeRole
  status: EmployeeStatus
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
}

export interface EmployeeCreateRequest {
  lastName: string
  firstName: string
  documentType: DocumentType
  pnOrIin: string
  phoneNumber: string
  email: string
  role: 'mentor' | 'teacher' | 'expert' | 'accountant'
}

export interface EmployeeCreateResultDto {
  type: CreateResultType
  conflictUser?: {
    id: number
    lastName: string
    firstName: string
    phoneNumber: string | null
    pnOrIin: string
    email: string | null
  }
  message?: string
}

export interface CreateEmployeeRequest {
  lastName: string
  firstName: string
  phoneNumber: string
  email: string
  iin: string
  notCitizen: boolean
  role: 'expert' | 'mentor' | 'teacher' | 'accountant'
}

export interface UpdateEmployeeRequest {
  iin?: string | null
  email?: string
  role?: 'expert' | 'mentor' | 'teacher' | 'accountant' | 'head' | 'director' | 'admin'
}

export interface UpdatePhoneRequest {
  phoneNumber: string
}

export interface ExistingUserInfo {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string
  iin: string
}

export interface ConflictResponse {
  conflictType: ConflictType
  user: ExistingUserInfo
}

// API Error types
export interface ApiErrorResponse {
  error: string
  message: string
  path: string
  status: number
  timestamp: string
  userId?: number
  existingUser?: ExistingUserInfo
  conflictType?: ConflictType
}

// Specialized error for employee conflicts (400)
export class EmployeesConflictError extends Error {
  status: number
  userId?: number
  existingUser?: ExistingUserInfo
  conflictType?: ConflictType

  constructor(message: string, status: number, details?: Partial<EmployeesConflictError>) {
    super(message)
    this.name = 'EmployeesConflictError'
    this.status = status
    this.userId = details?.userId
    this.existingUser = details?.existingUser
    this.conflictType = details?.conflictType
  }
}

// Type guard for conflict errors
export function isEmployeesConflictError(error: unknown): error is EmployeesConflictError {
  return error instanceof EmployeesConflictError
}
