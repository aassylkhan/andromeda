import { http } from '../../shared/api'
import type { SlotDto, SlotMatrixResponse, SlotUpsertRequest } from './types'

export async function getSlotsMatrix(officeId: number): Promise<SlotMatrixResponse> {
  const { data } = await http.get<SlotMatrixResponse>('/api/v1/slots', {
    params: { officeId },
  })
  return data
}

export async function upsertSlot(payload: SlotUpsertRequest): Promise<SlotDto> {
  const { data } = await http.put<SlotDto>('/api/v1/slots', payload)
  return data
}
