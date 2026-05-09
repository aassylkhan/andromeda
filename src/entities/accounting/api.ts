import { http } from '../../shared/api'
import type {
  PaymentRequest2ListItem,
  ExtensionRequestListItem,
  AccountingPageResponse,
} from './types'

export interface AccountingListParams {
  page?: number
  size?: number
  createdFrom?: string
  createdTo?: string
  expertIds?: number[]
  createdByIds?: number[]
  paymentStatuses?: string[]
  signatureStatuses?: string[]
}

export async function getAccountingPaymentRequests2(
  params?: AccountingListParams
): Promise<{ items: PaymentRequest2ListItem[]; total: number }> {
  const { data } = await http.get<AccountingPageResponse<PaymentRequest2ListItem>>(
    '/api/v1/accounting/payment-requests-2',
    {
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
    }
  )
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export async function getAccountingExtensionRequests(
  params?: AccountingListParams
): Promise<{ items: ExtensionRequestListItem[]; total: number }> {
  const { data } = await http.get<AccountingPageResponse<ExtensionRequestListItem>>(
    '/api/v1/accounting/extension-requests',
    {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        ...(params?.createdFrom && { createdFrom: params.createdFrom }),
        ...(params?.createdTo && { createdTo: params.createdTo }),
        ...(params?.createdByIds?.length && { createdByIds: params.createdByIds }),
        ...(params?.paymentStatuses?.length && { paymentStatuses: params.paymentStatuses }),
        ...(params?.signatureStatuses?.length && { signatureStatuses: params.signatureStatuses }),
      },
      paramsSerializer: { indexes: null },
    }
  )
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export const confirmPr2Payment = (id: number) => http.post(`/api/v1/accounting/payment-requests-2/${id}/confirm-payment`)
export const denyPr2Payment = (id: number) => http.post(`/api/v1/accounting/payment-requests-2/${id}/deny-payment`)
export const confirmPr2Signature = (id: number) => http.post(`/api/v1/accounting/payment-requests-2/${id}/confirm-signature`)
export const denyPr2Signature = (id: number) => http.post(`/api/v1/accounting/payment-requests-2/${id}/deny-signature`)

export const confirmErPayment = (id: number) => http.post(`/api/v1/accounting/extension-requests/${id}/confirm-payment`)
export const denyErPayment = (id: number) => http.post(`/api/v1/accounting/extension-requests/${id}/deny-payment`)
export const confirmErSignature = (id: number) => http.post(`/api/v1/accounting/extension-requests/${id}/confirm-signature`)
export const denyErSignature = (id: number) => http.post(`/api/v1/accounting/extension-requests/${id}/deny-signature`)
