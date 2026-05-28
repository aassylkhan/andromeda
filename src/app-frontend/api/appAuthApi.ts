import { appHttp } from './appHttp'

export type AppFlow = 'PARENT' | 'PARENT_NO_CHILDREN' | 'STUDENT' | 'SELECT_MODE'
export type AppMode = 'APP_PARENT' | 'APP_STUDENT' | 'APP_PENDING_SELECT'

export interface AppCurrentUser {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string
  mode: AppMode
  isParent: boolean
  isStudent: boolean
}

export interface AppLoginResult {
  flow: AppFlow
  accessToken: string
  refreshToken: string
  user: AppCurrentUser
}

export interface AppChild {
  studentId: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  freezings: number
}

export async function appSendCode(phoneNumber: string): Promise<void> {
  await appHttp.post('/api/v1/app-auth/send-code', { phoneNumber })
}

export async function appLogin(phoneNumber: string, code: string): Promise<AppLoginResult> {
  const { data } = await appHttp.post<AppLoginResult>('/api/v1/app-auth/login', {
    phoneNumber,
    code,
  })
  return data
}

export async function appSelectMode(mode: 'PARENT' | 'STUDENT'): Promise<AppLoginResult> {
  const { data } = await appHttp.post<AppLoginResult>('/api/v1/app-auth/select-mode', { mode })
  return data
}

export async function appGetMe(): Promise<AppCurrentUser> {
  const { data } = await appHttp.get<AppCurrentUser>('/api/v1/app-auth/me')
  return data
}

export async function appLogout(): Promise<void> {
  try {
    await appHttp.post('/api/v1/app-auth/logout')
  } catch {
    // ignore
  }
}

export async function appGetParentChildren(): Promise<AppChild[]> {
  const { data } = await appHttp.get<AppChild[]>('/api/v1/app/parent/children')
  return data
}
