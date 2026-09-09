import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Per-device "don't ask me to rate this event" list (2026-09-09). When the player picks
// "Nechci hodnotit" on the home screen's K ohodnocení section, the appointment id lands here and
// is filtered out of the rateable list from then on. Non-secret; same Platform branch as
// utils/onboarding.ts / celebrationStore.ts (expo-secure-store has no web build).
//
// ponytail: unbounded id list. In practice tiny — getRateable only returns the last 3 days, so
// ids older than that are never re-checked; a year of skips is a few hundred ints. Prune by age
// only if it ever matters.
const KEY = 'flotr_player_rating_skips'

const getItem = (k: string): Promise<string | null> =>
  Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(k)) : SecureStore.getItemAsync(k)

const setItem = (k: string, v: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(k, v)
    return Promise.resolve()
  }
  return SecureStore.setItemAsync(k, v)
}

export const getSkippedRatings = async (): Promise<number[]> => {
  try {
    const raw = await getItem(KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export const addSkippedRating = async (appointmentId: number): Promise<void> => {
  const current = await getSkippedRatings()
  if (current.includes(appointmentId)) return
  await setItem(KEY, JSON.stringify([...current, appointmentId])).catch(() => {})
}
