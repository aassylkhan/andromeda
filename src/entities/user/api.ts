import { http } from '../../shared/api'
import type {
  UserDto,
  CreateUserRequest,
  CreateUserResult,
  ConfirmCreateUserRequest,
  UpdateDocumentRequest,
  PageResponse,
} from './types'

interface GetUsersParams {
  page?: number
  size?: number
  q?: string
}

type UsersResponse = PageResponse<UserDto> | UserDto[]

function normalizeResponse(data: UsersResponse): { items: UserDto[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  return { items: data.content ?? [], total: data.totalElements ?? 0 }
}

export async function getUsers(params?: GetUsersParams): Promise<{ items: UserDto[]; total: number }> {
  const { data } = await http.get<UsersResponse>('/api/v1/users', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.q && { q: params.q }),
    },
  })
  return normalizeResponse(data)
}

export async function createUser(payload: CreateUserRequest): Promise<CreateUserResult> {
  try {
    const { data } = await http.post<CreateUserResult>('/api/v1/users', payload)
    return data
  } catch (error: any) {
    const status = error?.response?.status
    const respData = error?.response?.data
    if (status === 409 && respData) {
      return respData as CreateUserResult
    }
    throw new Error(respData?.message || 'Ошибка при создании пользователя')
  }
}

export async function confirmCreateUser(
  sourceUserId: number,
  payload: ConfirmCreateUserRequest
): Promise<UserDto> {
  const { data } = await http.post<UserDto>('/api/v1/users/confirm-create', payload, {
    params: { sourceUserId },
  })
  return data
}

export async function updateUserDocument(userId: number, payload: UpdateDocumentRequest): Promise<UserDto> {
  const { data } = await http.patch<UserDto>(`/api/v1/users/${userId}/document`, payload)
  return data
}
