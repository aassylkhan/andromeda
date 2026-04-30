/**
 * Изолированное хранилище токенов для app.andromeda.kz (parents/students).
 *
 * Используем префикс {@code app:} в ключах localStorage, чтобы:
 *  1. На production ничего не пересекается с employee CRM (origin'ы и так разные —
 *     yadro.andromeda.kz vs app.andromeda.kz — но префикс это страхует от
 *     случайной общей сборки или одного origin'а).
 *  2. Локальная разработка на localhost:5173 для обоих режимов сразу не приводит
 *     к взаимному перетиранию токенов.
 */
export interface Tokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'app:accessToken'
const REFRESH_TOKEN_KEY = 'app:refreshToken'

export function setAppTokens({ accessToken, refreshToken }: Tokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAppTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAppAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getAppRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
