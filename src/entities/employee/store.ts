import { create } from 'zustand'
import { getEmployees } from './api'
import type { Employee, EmployeeRole, EmployeeStatus } from './types'

interface EmployeeState {
  employees: Employee[]
  total: number
  loading: boolean
  error: string | null
  page: number
  size: number
  searchQuery: string
  selectedRoles: EmployeeRole[]
  selectedStatuses: EmployeeStatus[]
}

interface EmployeeActions {
  fetchEmployees: () => Promise<void>
  setPage: (page: number) => void
  setSize: (size: number) => void
  setSearchQuery: (q: string) => void
  setSelectedRoles: (roles: EmployeeRole[]) => void
  setSelectedStatuses: (statuses: EmployeeStatus[]) => void
}

type EmployeeStore = EmployeeState & EmployeeActions

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  employees: [],
  total: 0,
  loading: false,
  error: null,
  page: 0,
  size: 20,
  searchQuery: '',
  selectedRoles: [],
  selectedStatuses: [],

  fetchEmployees: async () => {
    const { page, size, searchQuery, selectedRoles, selectedStatuses } = get()
    set({ loading: true, error: null })
    try {
      const result = await getEmployees({
        page,
        size,
        q: searchQuery || undefined,
        roles: selectedRoles.length ? selectedRoles.join(',') : undefined,
        statuses: selectedStatuses.length ? selectedStatuses.join(',') : undefined,
      })
      set({ employees: result.items, total: result.total, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Ошибка', loading: false })
    }
  },

  setPage: (page) => set({ page }),
  setSize: (size) => set({ size }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedRoles: (selectedRoles) => set({ selectedRoles }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses }),
}))
