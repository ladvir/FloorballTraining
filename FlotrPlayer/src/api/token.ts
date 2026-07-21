import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// The JWT is the only thing worth protecting at rest on the device, so it goes
// through SecureStore (Keychain/Keystore) rather than AsyncStorage.
const TOKEN_KEY = 'flotr_player_token'

// expo-secure-store has no web implementation (there's no Keychain/Keystore to call into),
// so it throws on web instead of no-oping - route the web target through localStorage.
export const getToken = (): Promise<string | null> =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.getItem(TOKEN_KEY))
    : SecureStore.getItemAsync(TOKEN_KEY)

export const setToken = (token: string | null): Promise<void> => {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    return Promise.resolve()
  }
  return token ? SecureStore.setItemAsync(TOKEN_KEY, token) : SecureStore.deleteItemAsync(TOKEN_KEY)
}
