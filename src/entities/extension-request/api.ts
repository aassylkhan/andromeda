import { http } from '../../shared/api'

export interface ExtensionRequestCreatePayload {
  parentId: number
  classdays: number
  freezings: number
  fee: number
}

export interface ExtensionRequestDto {
  id: number
  createdAt: string
  createdById: number
  createdByFullName: string
  studentId: number
  studentFullName: string
  productId: number
  productName: string
  parentId: number
  parentFullName: string
  classdays: number
  hours: number
  months: number | string
  freezings: number
  fee: number | string
  paymentConfirmation: string | null
  signatureConfirmation: string | null
}

export async function createExtensionRequest(
  studentId: number,
  payload: ExtensionRequestCreatePayload
): Promise<ExtensionRequestDto> {
  const { data } = await http.post<ExtensionRequestDto>(
    `/api/v1/students/${studentId}/extension-requests`,
    payload
  )
  return data
}
