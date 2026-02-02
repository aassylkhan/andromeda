export type EmployeeRole = 'EXPERT' | 'MENTOR' | 'TEACHER' | 'ACCOUNTANT' | 'HEAD' | 'DIRECTOR' | 'ADMIN'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type DocumentType = 'ID_CARD' | 'PASSPORT'

export type EmployeeCreateResultType = 
  | 'CREATED' 
  | 'PHONE_TAKEN' 
  | 'EMAIL_TAKEN' 
  | 'USER_EXISTS_NOT_EMPLOYEE' 
  | 'EMPLOYEE_ALREADY_EXISTS'

export type ConflictType = 
  | 'PHONE_TAKEN' 
  | 'EMAIL_TAKEN' 
  | 'USER_EXISTS' 
  | 'EMPLOYEE_EXISTS'

export type Employee = {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string | null
  email: string | null
  pnOrIin: string // ID card or passport number with prefix (iin_... or pn_...)
  documentType?: DocumentType
  role: EmployeeRole
  status: EmployeeStatus
  preferredLanguage?: string | null
  createdAt?: string
}

export type PageResponse<T> = {
  items: T[]
  total: number
}

// Spec: EmployeeCreateRequest
export interface CreateEmployeeRequest {
  lastName: string
  firstName: string
  documentType: DocumentType // ID_CARD | PASSPORT
  pnOrIin: string // without prefix; backend will add iin_... or pn_...
  phoneNumber: string // only digits, no "+"
  email: string
  role: EmployeeRole // mentor|teacher|expert|accountant (any case)
}

// Spec: EmployeeCreateResultDto
export interface EmployeeCreateResultDto {
  type: EmployeeCreateResultType
  conflictUser?: ConflictUserDto
  message?: string
}

export interface ConflictUserDto {
  id: number
  lastName: string
  firstName: string
  phoneNumber: string
  pnOrIin: string
  email?: string
}

export interface UpdateEmployeeRequest {
  pnOrIin?: string | null
  email?: string
  role?: EmployeeRole
}

export interface ExistingUserInfo {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string
  pnOrIin: string
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
  type?: EmployeeCreateResultType
  userId?: number
  conflictUser?: ConflictUserDto
  conflictType?: ConflictType
}

// Specialized error for employee conflicts (400/409)
export class EmployeesConflictError extends Error {
  status: number
  type?: EmployeeCreateResultType
  conflictUser?: ConflictUserDto
  conflictType?: ConflictType

  constructor(
    message: string,
    status: number,
    details?: Partial<EmployeesConflictError>
  ) {
    super(message)
    this.name = 'EmployeesConflictError'
    this.status = status
    this.type = details?.type
    this.conflictUser = details?.conflictUser
    this.conflictType = details?.conflictType
  }
}

// Type guard for conflict errors
export function isEmployeesConflictError(error: unknown): error is EmployeesConflictError {
  return error instanceof EmployeesConflictError
}
