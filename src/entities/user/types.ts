export interface UserDto {
  id: number
  firstName: string
  lastName: string
  pnOrIin: string | null
  phoneNumber: string | null
  createdAt?: string
}

export type DocumentType = 'ID_CARD' | 'PASSPORT'

export interface CreateUserRequest {
  lastName: string
  firstName: string
  pnOrIin: string
  phoneNumber: string
}

export interface CreateUserResult {
  type: 'CREATED' | 'DOCUMENT_CONFLICT' | 'PHONE_CONFLICT'
  user?: UserDto
  existingUser?: UserDto
  message?: string
}

export interface ConfirmCreateUserRequest {
  lastName: string
  firstName: string
  pnOrIin: string
  phoneNumber: string
}

export interface UpdateDocumentRequest {
  pnOrIin: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
}
