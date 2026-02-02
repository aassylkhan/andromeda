import { create } from 'zustand'
import type { Employee } from './index'
import { getEmployees } from './index'

export interface EmployeeStoreState {
  items: Employee[]
  total: number
  loading: boolean
  error?: string
  q: string
  roleFilter: string
  statusFilter: string
  page: number
  size: number
}

export interface EmployeeStoreActions {
  setQuery: (q: string) => void
  setRoleFilter: (role: string) => void
  setStatusFilter: (status: string) => void
  setPage: (page: number) => void
  setSize: (size: number) => void
  fetchEmployees: () => Promise<void>
  refetch: () => Promise<void>
}

export type EmployeeStore = EmployeeStoreState & EmployeeStoreActions

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  items: [],
  total: 0,
  loading: false,
  error: undefined,
  q: '',
  roleFilter: '',
  statusFilter: '',
  page: 0,
  size: 20,

  setQuery: (q: string) => {
    set({ q, error: undefined, page: 0 })
  },

  setRoleFilter: (role: string) => {
    set({ roleFilter: role, error: undefined, page: 0 })
  },

  setStatusFilter: (status: string) => {
    set({ statusFilter: status, error: undefined, page: 0 })
  },

  setPage: (page: number) => {
    set({ page })
  },

  setSize: (size: number) => {
    set({ size, page: 0 })
  },

  fetchEmployees: async () => {
    const { loading, q, roleFilter, statusFilter, page, size } = get()

    if (loading) {
      return
    }

    set({ loading: true, error: undefined })

    try {
      // Use single endpoint with q parameter for search
      // Per spec: GET /api/v1/employees?q=query&roles=...&statuses=...&page=...&size=...
      const result = await getEmployees({
        q: q || undefined,
        roles: roleFilter ? [roleFilter] : undefined,
        statuses: statusFilter ? [statusFilter] : undefined,
        page,
        size,
      })
      set({ items: result.items, total: result.total, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch employees'

      set({
        error: errorMessage,
        loading: false,
      })
    }
  },

  refetch: async () => {
    await get().fetchEmployees()
  },
}))
