import { http } from '../../shared/api'
import type { StudentListItem, StudentDetail, StudentLookupItem, StudentParentLink, PageResponse } from './types'

export interface GetStudentsParams {
  page?: number
  size?: number
  q?: string
  gradeIds?: number[]
  productIds?: number[]
  learningLanguageIds?: number[]
  officeIds?: number[]
  learningHourOptionIds?: number[]
  curatorIds?: number[]
  offlineGroupHoursMin?: number
  offlineGroupHoursMax?: number
  offlineIndividualHoursMin?: number
  offlineIndividualHoursMax?: number
  onlineIndividualHoursMin?: number
  onlineIndividualHoursMax?: number
  freezingsMin?: number
  freezingsMax?: number
  offgrStartDateFrom?: string
  offgrStartDateTo?: string
}

export async function getStudents(
  params?: GetStudentsParams
): Promise<{ items: StudentListItem[]; total: number }> {
  const { data } = await http.get<PageResponse<StudentListItem>>('/api/v1/students', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.q && { q: params.q }),
      ...(params?.gradeIds?.length && { gradeIds: params.gradeIds }),
      ...(params?.productIds?.length && { productIds: params.productIds }),
      ...(params?.learningLanguageIds?.length && { learningLanguageIds: params.learningLanguageIds }),
      ...(params?.officeIds?.length && { officeIds: params.officeIds }),
      ...(params?.learningHourOptionIds?.length && { learningHourOptionIds: params.learningHourOptionIds }),
      ...(params?.curatorIds?.length && { curatorIds: params.curatorIds }),
      ...(params?.offlineGroupHoursMin != null && { offlineGroupHoursMin: params.offlineGroupHoursMin }),
      ...(params?.offlineGroupHoursMax != null && { offlineGroupHoursMax: params.offlineGroupHoursMax }),
      ...(params?.offlineIndividualHoursMin != null && { offlineIndividualHoursMin: params.offlineIndividualHoursMin }),
      ...(params?.offlineIndividualHoursMax != null && { offlineIndividualHoursMax: params.offlineIndividualHoursMax }),
      ...(params?.onlineIndividualHoursMin != null && { onlineIndividualHoursMin: params.onlineIndividualHoursMin }),
      ...(params?.onlineIndividualHoursMax != null && { onlineIndividualHoursMax: params.onlineIndividualHoursMax }),
      ...(params?.freezingsMin != null && { freezingsMin: params.freezingsMin }),
      ...(params?.freezingsMax != null && { freezingsMax: params.freezingsMax }),
      ...(params?.offgrStartDateFrom && { offgrStartDateFrom: params.offgrStartDateFrom }),
      ...(params?.offgrStartDateTo && { offgrStartDateTo: params.offgrStartDateTo }),
    },
    paramsSerializer: { indexes: null },
  })
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export async function addStudent(userId: number): Promise<StudentListItem> {
  const { data } = await http.post<StudentListItem>('/api/v1/students', { userId })
  return data
}

export async function getStudentDetail(studentId: number): Promise<StudentDetail> {
  const { data } = await http.get<StudentDetail>(`/api/v1/students/${studentId}`)
  return data
}

export async function searchStudentsLookup(q?: string): Promise<StudentLookupItem[]> {
  const { data } = await http.get<StudentLookupItem[]>('/api/v1/students/lookup', {
    params: q ? { q } : {},
  })
  return data
}

export async function getStudentParents(studentId: number): Promise<StudentParentLink[]> {
  const { data } = await http.get<StudentParentLink[]>(`/api/v1/students/${studentId}/parents`)
  return data
}

export async function addParentToStudent(studentId: number, parentId: number): Promise<StudentParentLink> {
  const { data } = await http.post<StudentParentLink>(`/api/v1/students/${studentId}/parents`, { parentId })
  return data
}

export async function removeParentFromStudent(studentId: number, linkId: number): Promise<void> {
  await http.delete(`/api/v1/students/${studentId}/parents/${linkId}`)
}

export interface CreatePaymentRequestData {
  expertId: number
  parentId: number
  gradeId: number
  productId: number
  learningLanguageId: number
  officeId: number
  learningHourOptionId: number
  comments?: string
  offgrStartDate: string
  freezings: number
  classdays: number
  membershipFee: number
  courseFee: number
}

export async function createPaymentRequest(studentId: number, data: CreatePaymentRequestData) {
  const { data: result } = await http.post(`/api/v1/students/${studentId}/payment-requests`, data)
  return result
}
