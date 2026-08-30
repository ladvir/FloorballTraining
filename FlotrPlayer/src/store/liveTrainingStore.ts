import { create } from 'zustand'

// Client-only live training runner (coach). In-memory only: leaving the LiveTraining screen and
// coming back keeps the clock, but killing the app ends the session. The timestamps are wall
// clock, so a backgrounded / locked phone resumes with correct numbers.

export interface LiveSession {
  trainingId: number
  trainingName: string
  appointmentId?: number
  appointmentName?: string
  sessionStartMs: number
  partStartedMs: number
  currentPartIndex: number
  finished: boolean
}

interface LiveTrainingStore {
  session: LiveSession | null
  start: (init: {
    trainingId: number
    trainingName: string
    appointmentId?: number
    appointmentName?: string
  }) => void
  nextPart: () => void
  finish: () => void
  close: () => void
}

export const useLiveTrainingStore = create<LiveTrainingStore>((set, get) => ({
  session: null,

  start: (init) => {
    const now = Date.now()
    set({
      session: {
        ...init,
        sessionStartMs: now,
        partStartedMs: now,
        currentPartIndex: 0,
        finished: false,
      },
    })
  },

  nextPart: () => {
    const s = get().session
    if (!s || s.finished) return
    set({ session: { ...s, currentPartIndex: s.currentPartIndex + 1, partStartedMs: Date.now() } })
  },

  finish: () => {
    const s = get().session
    if (!s) return
    set({ session: { ...s, finished: true } })
  },

  close: () => set({ session: null }),
}))
