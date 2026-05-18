import { dualStorage } from './tokenStorage'

export interface Tokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export function setTokens({ accessToken, refreshToken }: Tokens): void {
  dualStorage.set(ACCESS_TOKEN_KEY, accessToken)
  dualStorage.set(REFRESH_TOKEN_KEY, refreshToken)
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

/**
 * Recover tokens from IndexedDB into localStorage if iOS wiped LS.
 * Call once at app startup before any API requests.
 */
export async function recoverTokens(): Promise<void> {
  await dualStorage.recover(ACCESS_TOKEN_KEY)
  await dualStorage.recover(REFRESH_TOKEN_KEY)
}
