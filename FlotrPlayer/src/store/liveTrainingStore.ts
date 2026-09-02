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
  /** Wall-clock ms when the coach hit pause; while set, the clock is frozen at this instant. */
  pausedAtMs?: number
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
  pause: () => void
  resume: () => void
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
    if (!s || s.finished || s.pausedAtMs != null) return
    set({ session: { ...s, currentPartIndex: s.currentPartIndex + 1, partStartedMs: Date.now() } })
  },

  pause: () => {
    const s = get().session
    if (!s || s.finished || s.pausedAtMs != null) return
    set({ session: { ...s, pausedAtMs: Date.now() } })
  },

  // Continue where we left off: shift the start timestamps forward by the paused span.
  resume: () => {
    const s = get().session
    if (!s || s.pausedAtMs == null) return
    const delta = Date.now() - s.pausedAtMs
    set({
      session: {
        ...s,
        sessionStartMs: s.sessionStartMs + delta,
        partStartedMs: s.partStartedMs + delta,
        pausedAtMs: undefined,
      },
    })
  },

  finish: () => {
    const s = get().session
    if (!s) return
    set({ session: { ...s, finished: true } })
  },

  close: () => set({ session: null }),
}))
