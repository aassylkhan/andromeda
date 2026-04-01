export interface PaymentRequestItem {
  id: number
  createdAt: string
  studentId: number
  studentFullName: string
  expertUserId: number
  expertFullName: string
  parentId: number
  parentFullName: string
  gradeName: string
  productName: string
  learningLanguageName: string
  officeName: string
  learningHourOptionName: string
  comments: string | null
  offerStartDate: string
  freezings: number
  months: number
  classdays: number
  hours: number
  membershipFee: number
  courseFee: number
  totalFee: number
  paymentConfirmation: string | null
  signatureConfirmation: string | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
