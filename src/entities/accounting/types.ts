export interface PaymentRequest2ListItem {
  id: number
  createdAt: string
  studentId: number
  studentFullName: string
  expertUserId: number
  expertFullName: string
  offerStartDate: string
  hours: number
  fee: number
  firstMonthHours: number
  firstMonthFee: number
  remainingMonthsHours: number
  remainingMonthsFee: number
  paymentConfirmation: string | null
  signatureConfirmation: string | null
}

export interface ExtensionRequestListItem {
  id: number
  createdAt: string
  studentId: number
  studentFullName: string
  createdByUserId: number
  createdByFullName: string
  hours: number
  fee: number
  paymentConfirmation: string | null
  signatureConfirmation: string | null
}

export interface ReferralPayoutListItem {
  id: number
  createdAt: string
  userFullName: string
  amount: number
  bankDetails: string
  status: string
  payoutTime: string | null
}

export interface AccountingPageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
