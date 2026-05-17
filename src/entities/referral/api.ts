import http from '../../shared/api/http'
import type { RpInfoResponse, PayoutRequestItem, CreatePayoutRequest } from './types'

export async function getReferralInfo(): Promise<RpInfoResponse> {
  const { data } = await http.get<RpInfoResponse>('/api/v1/referral/info')
  return data
}

export async function getReferralPayouts(): Promise<PayoutRequestItem[]> {
  const { data } = await http.get<PayoutRequestItem[]>('/api/v1/referral/payouts')
  return data
}

export async function createReferralPayout(req: CreatePayoutRequest): Promise<PayoutRequestItem> {
  const { data } = await http.post<PayoutRequestItem>('/api/v1/referral/payouts', req)
  return data
}
