import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// The JWT and refresh token are the only things worth protecting at rest on the device, so
// they go through SecureStore (Keychain/Keystore) rather than AsyncStorage.
const ACCESS_TOKEN_KEY = 'flotr_player_token'
const REFRESH_TOKEN_KEY = 'flotr_player_refresh_token'

// expo-secure-store has no web implementation (there's no Keychain/Keystore to call into),
// so it throws on web instead of no-oping - route the web target through localStorage.
const getItem = (key: string): Promise<string | null> =>
  Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key)

const setItem = (key: string, value: string | null): Promise<void> => {
  if (Platform.OS === 'web') {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
    return Promise.resolve()
  }
  return value ? SecureStore.setItemAsync(key, value) : SecureStore.deleteItemAsync(key)
}

export const getAccessToken = (): Promise<string | null> => getItem(ACCESS_TOKEN_KEY)
export const setAccessToken = (token: string | null): Promise<void> => setItem(ACCESS_TOKEN_KEY, token)

export const getRefreshToken = (): Promise<string | null> => getItem(REFRESH_TOKEN_KEY)
export const setRefreshToken = (token: string | null): Promise<void> => setItem(REFRESH_TOKEN_KEY, token)

export const setTokens = async (accessToken: string | null, refreshToken: string | null): Promise<void> => {
  await setAccessToken(accessToken)
  await setRefreshToken(refreshToken)
}

export const clearTokens = (): Promise<void> => setTokens(null, null)
