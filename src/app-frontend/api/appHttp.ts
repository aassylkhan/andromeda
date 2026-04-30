import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import {
  getAppAccessToken,
  getAppRefreshToken,
  clearAppTokens,
  setAppTokens,
} from './appTokens'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.andromedaedu.kz'

/**
 * Эндпоинты, на которые НЕ нужно подкладывать Authorization
 * и которые НЕ должны триггерить refresh-логику.
 */
const APP_AUTH_EXCLUDE = [
  '/api/v1/app-auth/send-code',
  '/api/v1/app-auth/login',
  '/api/v1/app-auth/refresh',
]

const appHttp: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    }
  })
  isRefreshing = false
  failedQueue = []
}

const isExcluded = (url: string | undefined): boolean => {
  if (!url) return false
  return APP_AUTH_EXCLUDE.some((u) => url.includes(u))
}

const redirectToLogin = () => {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
    window.location.href = '/login'
  }
}

appHttp.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!isExcluded(config.url)) {
      const token = getAppAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

appHttp.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (isExcluded(originalRequest?.url)) {
      return Promise.reject(error)
    }

    // 403 (Forbidden) — токен валиден, но не имеет доступа к этому ресурсу.
    // Например APP token попал в employee endpoint. Чистим токены и редиректим.
    if (error.response?.status === 403) {
      clearAppTokens()
      redirectToLogin()
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return appHttp(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getAppRefreshToken()
      if (!refreshToken) {
        clearAppTokens()
        redirectToLogin()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/app-auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        )
        const { accessToken, refreshToken: newRefreshToken } = response.data
        setAppTokens({ accessToken, refreshToken: newRefreshToken })
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return appHttp(originalRequest)
      } catch (refreshError) {
        clearAppTokens()
        processQueue(refreshError as AxiosError, null)
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export { appHttp }
