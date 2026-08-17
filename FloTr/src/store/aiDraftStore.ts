import { create } from 'zustand'
import type { TrainingDraftDto } from '../types/domain.types'

interface AiDraftState {
  /** Consume-once handoff from the AI generator to the training form. Not persisted. */
  draft: TrainingDraftDto | null
  setDraft: (draft: TrainingDraftDto) => void
  consumeDraft: () => TrainingDraftDto | null
}

export const useAiDraftStore = create<AiDraftState>((set, get) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  consumeDraft: () => {
    const draft = get().draft
    if (draft) set({ draft: null })
    return draft
  },
}))
