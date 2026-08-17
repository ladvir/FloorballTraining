import { create } from 'zustand'

interface ConfirmStore {
  isOpen: boolean
  message: string
  title?: string
  onConfirm: (() => void) | null
  open: (message: string, onConfirm: () => void, title?: string) => void
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  message: '',
  title: undefined,
  onConfirm: null,
  open: (message, onConfirm, title) => set({ isOpen: true, message, onConfirm, title }),
  handleConfirm: () => {
    get().onConfirm?.()
    set({ isOpen: false, message: '', onConfirm: null, title: undefined })
  },
  handleCancel: () => set({ isOpen: false, message: '', onConfirm: null, title: undefined }),
}))

export function useConfirm() {
  return useConfirmStore((s) => s.open)
}
