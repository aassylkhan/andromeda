import { http } from '../../shared/api'
import type { LookupDto, ProductDetailDto } from './types'

export async function getGrades(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/grades')
  return data
}

export async function getProducts(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/products')
  return data
}

export async function getLearningLanguages(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/learning-languages')
  return data
}

export async function getOffices(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/offices')
  return data
}

export async function getLearningHourOptions(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/learning-hour-options')
  return data
}

export async function getCurators(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/curators')
  return data
}

export async function getExperts(): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/lookups/experts')
  return data
}

export async function getProductsDetail(): Promise<ProductDetailDto[]> {
  const { data } = await http.get<ProductDetailDto[]>('/api/v1/lookups/products-detail')
  return data
}
