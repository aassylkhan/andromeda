import { http } from '../../shared/api'
import type {
  ClassroomDto,
  GroupTypeDto,
  GroupListItemDto,
  GroupDetailDto,
  GroupMemberDto,
  GroupCreateRequest,
  GroupUpdateRequest,
} from './types'
import type { LookupDto } from '../lookup/types'

export async function getClassrooms(officeId: number): Promise<ClassroomDto[]> {
  const { data } = await http.get<ClassroomDto[]>('/api/v1/schedule/classrooms', {
    params: { officeId },
  })
  return data
}

export async function getGroupTypes(format?: string): Promise<GroupTypeDto[]> {
  const { data } = await http.get<GroupTypeDto[]>('/api/v1/schedule/group-types', {
    params: format ? { format } : {},
  })
  return data
}

export async function getTeachersBySubject(subjectId: number): Promise<LookupDto[]> {
  const { data } = await http.get<LookupDto[]>('/api/v1/schedule/teachers', {
    params: { subjectId },
  })
  return data
}

interface GetGroupsParams {
  officeId: number
  groupTypeIds?: number[]
  subjectIds?: number[]
  teacherIds?: number[]
  studentsFrom?: number
  studentsTo?: number
}

export async function getGroups(params: GetGroupsParams): Promise<GroupListItemDto[]> {
  const { data } = await http.get<GroupListItemDto[]>('/api/v1/schedule/groups', {
    params: {
      officeId: params.officeId,
      ...(params.groupTypeIds?.length && { groupTypeIds: params.groupTypeIds.join(',') }),
      ...(params.subjectIds?.length && { subjectIds: params.subjectIds.join(',') }),
      ...(params.teacherIds?.length && { teacherIds: params.teacherIds.join(',') }),
      ...(params.studentsFrom != null && { studentsFrom: params.studentsFrom }),
      ...(params.studentsTo != null && { studentsTo: params.studentsTo }),
    },
  })
  return data
}

export async function getGroupDetail(id: number): Promise<GroupDetailDto> {
  const { data } = await http.get<GroupDetailDto>(`/api/v1/schedule/groups/${id}`)
  return data
}

export async function createGroup(request: GroupCreateRequest): Promise<GroupDetailDto> {
  const { data } = await http.post<GroupDetailDto>('/api/v1/schedule/groups', request)
  return data
}

export async function updateGroup(id: number, request: GroupUpdateRequest): Promise<GroupDetailDto> {
  const { data } = await http.put<GroupDetailDto>(`/api/v1/schedule/groups/${id}`, request)
  return data
}

export async function deleteGroup(id: number): Promise<void> {
  await http.delete(`/api/v1/schedule/groups/${id}`)
}

export async function addStudentToGroup(groupId: number, studentId: number): Promise<GroupMemberDto> {
  const { data } = await http.post<GroupMemberDto>(`/api/v1/schedule/groups/${groupId}/members`, {
    studentId,
  })
  return data
}

export async function removeStudentFromGroup(groupId: number, studentId: number): Promise<void> {
  await http.delete(`/api/v1/schedule/groups/${groupId}/members/${studentId}`)
}
