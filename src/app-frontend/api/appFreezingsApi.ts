import { appHttp } from './appHttp'

export interface FreezingDto {
  id: number
  createdAt: string
  createdBy: number
  createdByFullName: string
  studentUid: number
  startDate: string
  endDate: string
}

export interface FreezingActionDto {
  freezing: FreezingDto | null
  availableFreezings: number
}

export interface CreateFreezingPayload {
  startDate: string
  endDate: string
}

export interface UpdateFreezingPayload {
  endDate: string
}

export async function appGetFreezings(studentUid: number): Promise<FreezingDto[]> {
  const { data } = await appHttp.get<FreezingDto[]>(`/api/v1/app/students/${studentUid}/freezings`)
  return data
}

export async function appCreateFreezing(
  studentUid: number,
  payload: CreateFreezingPayload
): Promise<FreezingActionDto> {
  const { data } = await appHttp.post<FreezingActionDto>(
    `/api/v1/app/students/${studentUid}/freezings`,
    payload
  )
  return data
}

export async function appDeleteFreezing(
  studentUid: number,
  freezingId: number
): Promise<FreezingActionDto> {
  const { data } = await appHttp.delete<FreezingActionDto>(
    `/api/v1/app/students/${studentUid}/freezings/${freezingId}`
  )
  return data
}

export async function appUpdateFreezingEndDate(
  studentUid: number,
  freezingId: number,
  payload: UpdateFreezingPayload
): Promise<FreezingActionDto> {
  const { data } = await appHttp.patch<FreezingActionDto>(
    `/api/v1/app/students/${studentUid}/freezings/${freezingId}`,
    payload
  )
  return data
}
