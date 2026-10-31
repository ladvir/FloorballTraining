import { create } from 'zustand'
import type { ActivitySuggestionDto } from '../types/domain.types'

export interface PendingVideoLink {
  url: string
  title?: string
}

interface AiActivityState {
  /** Consume-once handoff from the AI activity import to the activity form. Not persisted. */
  suggestion: ActivitySuggestionDto | null
  setSuggestion: (suggestion: ActivitySuggestionDto) => void
  consumeSuggestion: () => ActivitySuggestionDto | null
  /**
   * Consume-once handoff from "activity from a shared link": the form attaches this link as
   * the activity's video right after the first save (videos need an existing activity id).
   */
  videoLink: PendingVideoLink | null
  setVideoLink: (videoLink: PendingVideoLink | null) => void
  consumeVideoLink: () => PendingVideoLink | null
}

export const useAiActivityStore = create<AiActivityState>((set, get) => ({
  suggestion: null,
  setSuggestion: (suggestion) => set({ suggestion }),
  consumeSuggestion: () => {
    const suggestion = get().suggestion
    if (suggestion) set({ suggestion: null })
    return suggestion
  },
  videoLink: null,
  setVideoLink: (videoLink) => set({ videoLink }),
  consumeVideoLink: () => {
    const videoLink = get().videoLink
    if (videoLink) set({ videoLink: null })
    return videoLink
  },
}))
