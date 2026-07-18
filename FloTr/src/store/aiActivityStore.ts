import { create } from 'zustand'
import type { ActivitySuggestionDto } from '../types/domain.types'

interface AiActivityState {
  /** Consume-once handoff from the AI activity import to the activity form. Not persisted. */
  suggestion: ActivitySuggestionDto | null
  setSuggestion: (suggestion: ActivitySuggestionDto) => void
  consumeSuggestion: () => ActivitySuggestionDto | null
}

export const useAiActivityStore = create<AiActivityState>((set, get) => ({
  suggestion: null,
  setSuggestion: (suggestion) => set({ suggestion }),
  consumeSuggestion: () => {
    const suggestion = get().suggestion
    if (suggestion) set({ suggestion: null })
    return suggestion
  },
}))
