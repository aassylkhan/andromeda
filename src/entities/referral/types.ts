export interface ReferredClientItem {
  id: number
  createdAt: string
  name: string
  phoneNumber: string
  status: string
  paidAmount: number | null
  referrersShare: number | null
}

export interface RpInfoResponse {
  link: string
  rpBalance: number
  referrerRate: number
  referredClients: ReferredClientItem[]
}

export interface PayoutRequestItem {
  id: number
  createdAt: string
  amount: number
  bankDetails: string
  status: string
  payoutTime: string | null
}

export interface CreatePayoutRequest {
  amount: number
  method: string
  details: string
}
