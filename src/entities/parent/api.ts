import { http } from '../../shared/api'
import type { ParentListItem, ParentStudentLink, PageResponse } from './types'

interface GetParentsParams {
  page?: number
  size?: number
  q?: string
}

export async function getParents(
  params?: GetParentsParams
): Promise<{ items: ParentListItem[]; total: number }> {
  const { data } = await http.get<PageResponse<ParentListItem>>('/api/v1/parents', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.q && { q: params.q }),
    },
  })
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export async function addParent(userId: number): Promise<ParentListItem> {
  const { data } = await http.post<ParentListItem>('/api/v1/parents', { userId })
  return data
}

export async function getParentStudents(parentId: number): Promise<ParentStudentLink[]> {
  const { data } = await http.get<ParentStudentLink[]>(`/api/v1/parents/${parentId}/students`)
  return data
}

export async function addStudentToParent(parentId: number, studentId: number): Promise<ParentStudentLink> {
  const { data } = await http.post<ParentStudentLink>(`/api/v1/parents/${parentId}/students`, { studentId })
  return data
}

export async function removeStudentFromParent(parentId: number, linkId: number): Promise<void> {
  await http.delete(`/api/v1/parents/${parentId}/students/${linkId}`)
}
