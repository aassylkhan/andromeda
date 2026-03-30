export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserSections {
  allUsers: boolean
  employees: boolean
  mySessions: boolean
  admin: boolean
  students: boolean
  parents: boolean
  paymentRequests: boolean
}

export interface User {
  userId: number
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
