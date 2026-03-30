import { http } from '../../shared/api'
import type { PaymentRequestItem, PageResponse } from './types'

export interface GetPaymentRequestsParams {
  page?: number
  size?: number
  createdFrom?: string
  createdTo?: string
  expertIds?: number[]
  paymentStatuses?: string[]
  signatureStatuses?: string[]
}

export async function getPaymentRequests(
  params?: GetPaymentRequestsParams
): Promise<{ items: PaymentRequestItem[]; total: number }> {
  const { data } = await http.get<PageResponse<PaymentRequestItem>>('/api/v1/payment-requests', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.createdFrom && { createdFrom: params.createdFrom }),
      ...(params?.createdTo && { createdTo: params.createdTo }),
      ...(params?.expertIds?.length && { expertIds: params.expertIds }),
      ...(params?.paymentStatuses?.length && { paymentStatuses: params.paymentStatuses }),
      ...(params?.signatureStatuses?.length && { signatureStatuses: params.signatureStatuses }),
    },
    paramsSerializer: { indexes: null },
  })
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export async function confirmPayment(id: number): Promise<void> {
  await http.post(`/api/v1/payment-requests/${id}/confirm-payment`)
}

export async function denyPayment(id: number): Promise<void> {
  await http.post(`/api/v1/payment-requests/${id}/deny-payment`)
}

export async function confirmSignature(id: number): Promise<void> {
  await http.post(`/api/v1/payment-requests/${id}/confirm-signature`)
}

export async function denySignature(id: number): Promise<void> {
  await http.post(`/api/v1/payment-requests/${id}/deny-signature`)
}
