import { create } from 'zustand'
import { appGetParentChildren } from '../api/appAuthApi'
import type { AppChild } from '../api/appAuthApi'

interface ChildrenState {
  children: AppChild[]
  loaded: boolean
  loading: boolean
  error: string | null
}

interface ChildrenActions {
  load: () => Promise<void>
  setChildFreezings: (studentId: number, freezings: number) => void
  reset: () => void
}

type ChildrenStore = ChildrenState & ChildrenActions

export const useParentChildrenStore = create<ChildrenStore>((set) => ({
  children: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const list = await appGetParentChildren()
      set({ children: list, loaded: true, loading: false })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось загрузить детей'
      set({ error: msg, loading: false })
    }
  },

  setChildFreezings: (studentId, freezings) =>
    set((state) => ({
      children: state.children.map((child) =>
        child.studentId === studentId ? { ...child, freezings } : child
      ),
    })),

  reset: () => set({ children: [], loaded: false, loading: false, error: null }),
}))
