import { create } from 'zustand'
import { setTokens, clearTokens, getAccessToken } from '../../shared/api/tokens'
import * as api from '../api/appAuthApi'
import type { AppCurrentUser, AppFlow } from '../api/appAuthApi'

const PHONE_KEY = 'app_tempPhone'

interface AppAuthState {
  user: AppCurrentUser | null
  loading: boolean
  error: string | null
  phoneNumber: string | null
  lastFlow: AppFlow | null
}

interface AppAuthActions {
  setPhoneNumber: (phoneNumber: string) => void
  clearError: () => void
  sendCode: (phoneNumber: string) => Promise<void>
  login: (phoneNumber: string, code: string) => Promise<AppFlow>
  selectMode: (mode: 'PARENT' | 'STUDENT') => Promise<AppFlow>
  loadMe: () => Promise<void>
  logout: () => Promise<void>
  reset: () => void
}

type AppAuthStore = AppAuthState & AppAuthActions

const errorMessage = (e: unknown, fallback: string) => {
  const err = e as { response?: { data?: { message?: string; error?: string } } }
  return err?.response?.data?.message ?? err?.response?.data?.error ?? fallback
}

export const useAppAuthStore = create<AppAuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  phoneNumber: localStorage.getItem(PHONE_KEY),
  lastFlow: null,

  setPhoneNumber: (phoneNumber: string) => {
    localStorage.setItem(PHONE_KEY, phoneNumber)
    set({ phoneNumber, error: null })
  },

  clearError: () => set({ error: null }),

  sendCode: async (phoneNumber: string) => {
    set({ loading: true, error: null })
    try {
      await api.appSendCode(phoneNumber)
      localStorage.setItem(PHONE_KEY, phoneNumber)
      set({ phoneNumber, loading: false })
    } catch (e: unknown) {
      set({ error: errorMessage(e, 'Не удалось отправить код'), loading: false })
      throw e
    }
  },

  login: async (phoneNumber: string, code: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.appLogin(phoneNumber, code)
      setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken })
      localStorage.removeItem(PHONE_KEY)
      set({
        loading: false,
        user: result.user,
        phoneNumber: null,
        lastFlow: result.flow,
      })
      return result.flow
    } catch (e: unknown) {
      set({ error: errorMessage(e, 'Неверный код'), loading: false })
      throw e
    }
  },

  selectMode: async (mode: 'PARENT' | 'STUDENT') => {
    set({ loading: true, error: null })
    try {
      const result = await api.appSelectMode(mode)
      setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken })
      set({ loading: false, user: result.user, lastFlow: result.flow })
      return result.flow
    } catch (e: unknown) {
      set({ error: errorMessage(e, 'Не удалось выбрать режим'), loading: false })
      throw e
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
      const user = await api.appGetMe()
      set({ user, loading: false })
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        clearTokens()
        set({ user: null, loading: false, error: null })
        return
      }
      set({ user: null, loading: false, error: errorMessage(e, 'Не удалось загрузить профиль') })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await api.appLogout()
    } finally {
      clearTokens()
      localStorage.removeItem(PHONE_KEY)
      set({ user: null, loading: false, error: null, phoneNumber: null, lastFlow: null })
    }
    void get
  },

  reset: () => {
    clearTokens()
    localStorage.removeItem(PHONE_KEY)
    set({ user: null, loading: false, error: null, phoneNumber: null, lastFlow: null })
  },
}))
