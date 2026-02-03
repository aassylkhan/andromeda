export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserSections {
  admin: boolean
  employees: boolean
  mySessions: boolean
}

export interface User {
  userId: number
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  roles: string[]
  sections: UserSections
}

export interface SendCodeRequest {
  phoneNumber: string
}

export interface LoginRequest {
  phoneNumber: string
  code: string
}

export interface RefreshRequest {
  refreshToken: string
}
