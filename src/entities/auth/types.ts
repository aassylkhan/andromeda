/**
 * SPEC: Auth tokens returned by POST /api/v1/auth/login
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/**
 * User sections (roles/permissions) that control menu visibility and feature access.
 */
export interface UserSections {
  admin?: boolean
  employees?: boolean
  mySessions?: boolean
}

/**
 * SPEC: Response from GET /api/v1/auth/me
 * sections.employees = true/false controls "Сотрудники" section visibility.
 */
export interface User {
  userId: number
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  roles: string[] // e.g., ["head", "mentor"], ["director"], etc.
  sections: UserSections
}

/**
 * SPEC: Request for POST /api/v1/auth/send-code
 * phoneNumber should be only digits without "+", e.g. "77001234567"
 */
export interface SendCodeRequest {
  phoneNumber: string // only digits, no "+"
}

/**
 * SPEC: Request for POST /api/v1/auth/login
 * phoneNumber: only digits without "+"
 * code: master code sent to phone (e.g. "250219")
 */
export interface LoginRequest {
  phoneNumber: string // only digits, no "+"
  code: string
}

/**
 * Internal: Request for POST /api/v1/auth/refresh
 */
export interface RefreshRequest {
  refreshToken: string
}
