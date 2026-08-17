import { create } from 'zustand'
import type { ActivityDto } from '../types/domain.types'

interface ActivitySelectionState {
  selectedActivities: ActivityDto[]
  addActivity: (activity: ActivityDto) => void
  removeActivity: (id: number) => void
  clearAll: () => void
}

export const useActivitySelectionStore = create<ActivitySelectionState>((set) => ({
  selectedActivities: [],

  addActivity: (activity) =>
    set((state) => {
      if (state.selectedActivities.some((a) => a.id === activity.id)) return state
      return { selectedActivities: [...state.selectedActivities, activity] }
    }),

  removeActivity: (id) =>
    set((state) => ({
      selectedActivities: state.selectedActivities.filter((a) => a.id !== id),
    })),

  clearAll: () => set({ selectedActivities: [] }),
}))
