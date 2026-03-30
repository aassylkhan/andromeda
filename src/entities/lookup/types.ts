export interface LookupDto {
  id: number
  name: string
}

export interface ProductDetailDto {
  id: number
  name: string
  amountOfClassdaysIn1m: number | null
  amountOfHoursIn1cd: number | null
}
