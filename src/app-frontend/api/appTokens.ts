/**
 * Изолированное хранилище токенов для app.andromeda.kz (parents/students).
 *
 * Используем префикс {@code app:} в ключах, чтобы:
 *  1. На production ничего не пересекается с employee CRM (origin'ы и так разные —
 *     yadro.andromeda.kz vs app.andromeda.kz — но префикс это страхует от
 *     случайной общей сборки или одного origin'а).
 *  2. Локальная разработка на localhost:5173 для обоих режимов сразу не приводит
 *     к взаимному перетиранию токенов.
 *
 * Dual-write: localStorage + IndexedDB — устойчивость на iOS standalone.
 */
import { dualStorage } from '../../shared/api/tokenStorage'

export interface Tokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'app:accessToken'
const REFRESH_TOKEN_KEY = 'app:refreshToken'

export function setAppTokens({ accessToken, refreshToken }: Tokens): void {
  dualStorage.set(ACCESS_TOKEN_KEY, accessToken)
  dualStorage.set(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAppTokens(): void {
  dualStorage.remove(ACCESS_TOKEN_KEY)
  dualStorage.remove(REFRESH_TOKEN_KEY)
}

export function getAppAccessToken(): string | null {
  return dualStorage.get(ACCESS_TOKEN_KEY)
}

export function getAppRefreshToken(): string | null {
  return dualStorage.get(REFRESH_TOKEN_KEY)
}

/**
 * Recover tokens from IndexedDB into localStorage if iOS wiped LS.
 * Call once at app startup before any API requests.
 */
export async function recoverAppTokens(): Promise<void> {
  await dualStorage.recover(ACCESS_TOKEN_KEY)
  await dualStorage.recover(REFRESH_TOKEN_KEY)
}
