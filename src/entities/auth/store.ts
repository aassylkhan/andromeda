import { create } from 'zustand'
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../../shared/api/tokens'
import * as authApi from './api'
import type { User } from './types'

const PHONE_NUMBER_KEY = 'tempPhoneNumber'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  phoneNumber: string | null
}

interface AuthActions {
  sendCode: (phoneNumber: string) => Promise<void>
  login: (phoneNumber: string, code: string) => Promise<void>
  loadMe: () => Promise<void>
  logout: () => Promise<void>
  setPhoneNumber: (phoneNumber: string) => void
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  phoneNumber: localStorage.getItem(PHONE_NUMBER_KEY),

  setPhoneNumber: (phoneNumber: string) => {
    localStorage.setItem(PHONE_NUMBER_KEY, phoneNumber)
    set({ phoneNumber, error: null })
  },

  clearError: () => {
    set({ error: null })
  },

  sendCode: async (phoneNumber: string) => {
    set({ loading: true, error: null })
    try {
      await authApi.sendCode({ phoneNumber })
    } catch {
      // SMS service not configured yet — proceed with master code
    }
    localStorage.setItem(PHONE_NUMBER_KEY, phoneNumber)
    set({ phoneNumber, loading: false })
  },

  login: async (phoneNumber: string, code: string) => {
    set({ loading: true, error: null })
    try {
      const tokens = await authApi.login({ phoneNumber, code })
      setTokens(tokens)
      localStorage.removeItem(PHONE_NUMBER_KEY)
      
      // Загружаем данные пользователя
      await get().loadMe()
      set({ loading: false, phoneNumber: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неверный код'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  loadMe: async () => {
    const token = getAccessToken()
    if (!token) {
      set({ user: null })
      return
    }

    set({ loading: true, error: null })
    try {
      const user = await authApi.getMe()
      set({ user, loading: false })
    } catch (error: any) {
      // Если 401 - пробуем рефреш
      if (error?.response?.status === 401) {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          try {
            const tokens = await authApi.refresh({ refreshToken })
            setTokens(tokens)
            // Повторяем запрос
            const user = await authApi.getMe()
            set({ user, loading: false })
            return
          } catch (refreshError) {
            // Refresh не удался - разлогиниваем
            clearTokens()
            localStorage.removeItem(PHONE_NUMBER_KEY)
            set({ user: null, loading: false, error: 'Сессия истекла' })
            return
          }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить профиль'
      set({ error: errorMessage, loading: false, user: null })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
      localStorage.removeItem(PHONE_NUMBER_KEY)
      set({ user: null, loading: false, error: null, phoneNumber: null })
    }
  },
}))
