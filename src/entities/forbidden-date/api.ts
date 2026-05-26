import { http } from '../../shared/api'
import type {
  CreateForbiddenDatesRangePayload,
  CreateForbiddenDatesRangeResult,
  ForbiddenDateItem,
} from './types'

export async function getForbiddenDates(): Promise<ForbiddenDateItem[]> {
  const { data } = await http.get<ForbiddenDateItem[]>('/api/v1/forbidden-dates')
  return data
}

export async function getBlockedDates(): Promise<string[]> {
  const { data } = await http.get<string[]>('/api/v1/forbidden-dates/dates')
  return data
}

export async function createForbiddenDatesRange(
  payload: CreateForbiddenDatesRangePayload
): Promise<CreateForbiddenDatesRangeResult> {
  const { data } = await http.post<CreateForbiddenDatesRangeResult>(
    '/api/v1/forbidden-dates/range',
    payload
  )
  return data
}

export async function deleteForbiddenDate(id: number): Promise<void> {
  await http.delete(`/api/v1/forbidden-dates/${id}`)
}
