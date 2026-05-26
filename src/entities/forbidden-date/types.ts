export interface ForbiddenDateItem {
  id: number
  createdAt: string
  createdByUserId: number
  createdByFullName: string
  date: string
}

export interface CreateForbiddenDatesRangePayload {
  fromDate: string
  toDate: string
}

export interface CreateForbiddenDatesRangeResult {
  requestedCount: number
  createdCount: number
  skippedCount: number
}
