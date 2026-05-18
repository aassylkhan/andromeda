import { dualStorage } from '../shared/api/tokenStorage'

export type Tokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export function getTokens(): Tokens | null {
  const accessToken = dualStorage.get(ACCESS_TOKEN_KEY)
  const refreshToken = dualStorage.get(REFRESH_TOKEN_KEY)
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export function setTokens(tokens: Tokens): void {
  dualStorage.set(ACCESS_TOKEN_KEY, tokens.accessToken)
  dualStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  dualStorage.remove(ACCESS_TOKEN_KEY)
  dualStorage.remove(REFRESH_TOKEN_KEY)
}

export function getAccessToken(): string | null {
  return dualStorage.get(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return dualStorage.get(REFRESH_TOKEN_KEY)
}
