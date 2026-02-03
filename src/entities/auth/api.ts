import { http } from '../../shared/api'
import type { AuthTokens, LoginRequest, RefreshRequest, SendCodeRequest, User } from './types'

export async function sendCode(data: SendCodeRequest): Promise<void> {
  await http.post('/api/v1/auth/send-code', data)
}

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const response = await http.post<AuthTokens>('/api/v1/auth/login', data)
  return response.data
}

export async function refresh(data: RefreshRequest): Promise<AuthTokens> {
  const response = await http.post<AuthTokens>('/api/v1/auth/refresh', data)
  return response.data
}

export async function getMe(): Promise<User> {
  const response = await http.get<User>('/api/v1/auth/me')
  return response.data
}

export async function logout(): Promise<void> {
  try {
    await http.post('/api/v1/auth/logout')
  } catch (error) {
    // Если 500 - все равно считаем что вышли
    console.error('Logout error:', error)
  }
}
