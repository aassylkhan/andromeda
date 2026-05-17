import { appHttp } from './appHttp'

export interface AppRpInfo {
  link: string
  rpBalance: number
  referrerRate: number
  referredClients: AppReferredClient[]
}

export interface AppReferredClient {
  id: number
  createdAt: string
  name: string
  phoneNumber: string
  status: string
  paidAmount: number | null
  referrersShare: number | null
}

export interface AppPayoutRequest {
  id: number
  createdAt: string
  amount: number
  bankDetails: string
  status: string
  payoutTime: string | null
}

export interface AppCreatePayoutRequest {
  amount: number
  method: string
  details: string
}

export async function appGetReferralInfo(): Promise<AppRpInfo> {
  const { data } = await appHttp.get<AppRpInfo>('/api/v1/app/referral/info')
  return data
}

export async function appGetPayouts(): Promise<AppPayoutRequest[]> {
  const { data } = await appHttp.get<AppPayoutRequest[]>('/api/v1/app/referral/payouts')
  return data
}

export async function appCreatePayout(req: AppCreatePayoutRequest): Promise<AppPayoutRequest> {
  const { data } = await appHttp.post<AppPayoutRequest>('/api/v1/app/referral/payouts', req)
  return data
}
