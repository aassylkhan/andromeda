import { http } from '../../shared/api'

export interface PaymentRequest2CreatePayload {
  expertId: number
  parentId: number
  gradeId: number
  productId: number
  learningLanguageId: number
  officeId: number
  learningHourOptionId: number
  comments?: string
  offerStartDate: string
  freezings: number
  classdays: number
  fee: number
}

export interface PaymentRequest2Dto {
  id: number
  createdAt: string
  studentId: number
  studentFullName: string
  expertUserId: number
  expertFullName: string
  parentId: number
  parentFullName: string
  gradeId: number
  gradeName: string
  productId: number
  productName: string
  learningLanguageId: number
  learningLanguageName: string
  officeId: number
  officeName: string
  learningHourOptionId: number
  learningHourOptionName: string
  comments: string | null
  offerStartDate: string
  freezings: number
  classdays: number
  months: number | string
  hours: number
  fee: number | string
  firstMonthHours: number
  firstMonthFee: number | string
  remainingMonthsHours: number
  remainingMonthsFee: number | string
  paymentConfirmation: string | null
  signatureConfirmation: string | null
}

export async function createPaymentRequest2(
  studentId: number,
  payload: PaymentRequest2CreatePayload
): Promise<PaymentRequest2Dto> {
  const { data } = await http.post<PaymentRequest2Dto>(
    `/api/v1/students/${studentId}/payment-requests-2`,
    payload
  )
  return data
}
