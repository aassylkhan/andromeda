export interface UserDto {
  id: number
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  phoneNumber: string | null
  createdAt?: string
}

export type DocumentType = 'ID_CARD' | 'PASSPORT'

export interface CreateUserRequest {
  lastName: string
  firstName: string
  documentType: DocumentType
  documentNumber: string
  phoneNumber: string
}

export interface CreateUserResult {
  type: 'CREATED' | 'DOCUMENT_ALREADY_EXISTS' | 'PHONE_TAKEN'
  newUser?: UserDto | null
  existingUser?: UserDto | null
  message?: string
}

export interface ConfirmCreateUserRequest {
  lastName: string
  firstName: string
  documentType: DocumentType
  documentNumber: string
  phoneNumber: string
}

export interface UpdateDocumentRequest {
  documentType: DocumentType
  documentNumber: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
}
