import { http } from '../../shared/api'
import type { AuthTokens, LoginRequest, RefreshRequest, SendCodeRequest, User } from './types'

// ============================================================================
// SPEC: POST /api/v1/auth/send-code
// ============================================================================

/**
 * Send verification code to phone number.
 * Phone should be only digits without "+".
 */
export async function sendCode(data: SendCodeRequest): Promise<void> {
  await http.post('/api/v1/auth/send-code', {
    phoneNumber: data.phoneNumber, // only digits
  })
}

// ============================================================================
// SPEC: POST /api/v1/auth/login
// ============================================================================

/**
 * Login with phone and verification code.
 * Returns accessToken and refreshToken.
 * Frontend should store accessToken and set it in Authorization: Bearer header.
 */
export async function login(data: LoginRequest): Promise<AuthTokens> {
  const response = await http.post<AuthTokens>('/api/v1/auth/login', {
    phoneNumber: data.phoneNumber, // only digits
    code: data.code,
  })
  return response.data
}

// ============================================================================
// SPEC: GET /api/v1/auth/me (с Authorization header)
// ============================================================================

/**
 * Get current user data.
 * Requires Authorization: Bearer <accessToken> header.
 * Response includes sections.employees = true/false to control menu visibility.
 */
export async function getMe(): Promise<User> {
  const response = await http.get<User>('/api/v1/auth/me')
  return response.data
}

// ============================================================================
// Additional (not in spec but used internally)
// ============================================================================

export async function refresh(data: RefreshRequest): Promise<AuthTokens> {
  const response = await http.post<AuthTokens>('/api/v1/auth/refresh', data)
  return response.data
}

export async function logout(): Promise<void> {
  try {
    await http.post('/api/v1/auth/logout')
  } catch (error) {
    // Log but don't throw - user may be already logged out
    console.error('Logout error:', error)
  }
}
