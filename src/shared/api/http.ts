import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, getRefreshToken, clearTokens, setTokens } from './tokens'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.andromedaedu.kz'

// Auth endpoints that should be excluded from token refresh logic
const AUTH_EXCLUDE = [
  '/api/v1/auth/send-code',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
]

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })

  isRefreshing = false
  failedQueue = []
}

// Helper to check if URL is in AUTH_EXCLUDE list
const isAuthExcludedEndpoint = (url: string | undefined): boolean => {
  if (!url) return false
  return AUTH_EXCLUDE.some((excluded) => url.includes(excluded))
}

// Request interceptor: add Authorization header if token exists
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Не добавляем токен для публичных auth эндпоинтов
    if (!isAuthExcludedEndpoint(config.url)) {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 with token refresh
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Пропускаем refresh для auth-эндпоинтов из списка исключений
    if (isAuthExcludedEndpoint(originalRequest?.url)) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если уже идет refresh - добавляем запрос в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return http(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()

      // Нет refresh токена - редирект на логин (если не уже там)
      if (!refreshToken) {
        clearTokens()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // Пытаемся обновить токен
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data
        setTokens({ accessToken, refreshToken: newRefreshToken })
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return http(originalRequest)
      } catch (refreshError) {
        clearTokens()
        processQueue(refreshError as AxiosError, null)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default http
