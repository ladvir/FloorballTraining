import { create } from 'zustand'

// Client-only live training runner. One session at a time; persisted to localStorage so a page
// reload mid-training keeps the clock (see authStore for the same manual-persist pattern).

const KEY = 'flotr_live_training'

export interface LiveSession {
  trainingId: number
  trainingName: string
  /** Set when launched from a calendar event — enables the "rate event" step on finish. */
  appointmentId?: number
  appointmentName?: string
  sessionStartMs: number
  partStartedMs: number
  currentPartIndex: number
  /** true once the coach advances past the last part. */
  finished: boolean
  minimized: boolean
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
  setMinimized: (v: boolean) => void
}

const load = (): LiveSession | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LiveSession) : null
  } catch {
    return null
  }
}

const save = (s: LiveSession | null) => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage full / disabled — the in-memory session still works for this tab */
  }
}

export const useLiveTrainingStore = create<LiveTrainingStore>((set, get) => ({
  session: load(),

  start: (init) => {
    const now = Date.now()
    const session: LiveSession = {
      ...init,
      sessionStartMs: now,
      partStartedMs: now,
      currentPartIndex: 0,
      finished: false,
      minimized: false,
    }
    save(session)
    set({ session })
  },

  nextPart: () => {
    const s = get().session
    if (!s || s.finished) return
    const next: LiveSession = {
      ...s,
      currentPartIndex: s.currentPartIndex + 1,
      partStartedMs: Date.now(),
    }
    save(next)
    set({ session: next })
  },

  finish: () => {
    const s = get().session
    if (!s) return
    const next: LiveSession = { ...s, finished: true }
    save(next)
    set({ session: next })
  },

  close: () => {
    save(null)
    set({ session: null })
  },

  setMinimized: (v) => {
    const s = get().session
    if (!s) return
    const next = { ...s, minimized: v }
    save(next)
    set({ session: next })
  },
}))
