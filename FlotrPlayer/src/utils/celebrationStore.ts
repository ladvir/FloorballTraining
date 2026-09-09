import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { CelebrationState } from './celebrations'

// Per-player persistence for the login celebration snapshot. Same Platform branch as
// utils/onboarding.ts / api/token.ts (expo-secure-store has no web build). Non-secret.
const storeKey = (memberId: number) => `flotr_player_celebrated_${memberId}`

const getItem = (k: string): Promise<string | null> =>
  Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(k)) : SecureStore.getItemAsync(k)

const setItem = (k: string, v: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(k, v)
    return Promise.resolve()
  }
  return SecureStore.setItemAsync(k, v)
}

export const getCelebrationState = async (memberId: number): Promise<CelebrationState | null> => {
  try {
    const raw = await getItem(storeKey(memberId))
    return raw ? (JSON.parse(raw) as CelebrationState) : null
  } catch {
    return null
  }
}

export const saveCelebrationState = (memberId: number, state: CelebrationState): Promise<void> =>
  setItem(storeKey(memberId), JSON.stringify(state)).catch(() => {})
