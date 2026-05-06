import type { LookupDto } from '../lookup/types'

export interface SlotCellDto {
  learningHourOptionId: number
  x: number
  y: number
  z: string | null
}

export interface SlotMatrixRowDto {
  learningLanguageId: number
  learningLanguageName: string
  productId: number
  productName: string
  cells: SlotCellDto[]
}

export interface SlotMatrixResponse {
  officeId: number
  officeName: string
  hourOptions: LookupDto[]
  rows: SlotMatrixRowDto[]
}

export interface SlotUpsertRequest {
  learningLanguageId: number
  productId: number
  officeId: number
  learningHourOptionId: number
  quota: number
  comment: string | null
}

export interface SlotDto {
  id: number
  learningLanguageId: number
  productId: number
  officeId: number
  learningHourOptionId: number
  quota: number
  comment: string | null
}
