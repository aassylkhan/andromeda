export interface StudentListItem {
  studentId: number
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
  gradeId: number | null
  gradeName: string | null
  productId: number | null
  productName: string | null
  learningLanguageId: number | null
  learningLanguageName: string | null
  officeId: number | null
  officeName: string | null
  learningHourOptionId: number | null
  learningHourOptionName: string | null
  curatorUserId: number | null
  curatorLastName: string | null
  curatorFirstName: string | null
  amountOfOfflineGroupHours: number
  amountOfOfflineIndividualHours: number
  amountOfOnlineIndividualHours: number
  freezings: number
  offgrStartDate: string | null
}

export interface StudentDetail {
  studentId: number
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
  pnOrIin: string | null
  gradeId: number | null
  gradeName: string | null
  productId: number | null
  productName: string | null
  learningLanguageId: number | null
  learningLanguageName: string | null
  officeId: number | null
  officeName: string | null
  learningHourOptionId: number | null
  learningHourOptionName: string | null
  curatorUserId: number | null
  curatorLastName: string | null
  curatorFirstName: string | null
  amountOfOfflineGroupHours: number
  amountOfOfflineIndividualHours: number
  amountOfOnlineIndividualHours: number
  freezings: number
  offgrStartDate: string | null
}

export interface StudentLookupItem {
  studentId: number
  userId: number
  lastName: string
  firstName: string
  phoneNumber: string | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
