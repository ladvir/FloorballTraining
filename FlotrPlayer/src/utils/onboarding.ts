import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Same Platform-branch pattern as api/token.ts (expo-secure-store has no web implementation) -
// just one non-secret boolean flag, so no need for a shared helper beyond copying that pattern.
const SEEN_ONBOARDING_KEY = 'flotr_player_seen_onboarding'

const getItem = (key: string): Promise<string | null> =>
  Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key)

const setItem = (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value)
    return Promise.resolve()
  }
  return SecureStore.setItemAsync(key, value)
}

export const hasSeenOnboarding = async (): Promise<boolean> => (await getItem(SEEN_ONBOARDING_KEY)) === 'true'
export const setSeenOnboarding = (): Promise<void> => setItem(SEEN_ONBOARDING_KEY, 'true')
