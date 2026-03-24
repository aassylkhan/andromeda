export interface ParentListItem {
  parentId: number
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
}

export interface ParentStudentLink {
  linkId: number
  studentId: number
  studentUserId: number
  fullName: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
