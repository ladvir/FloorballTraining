import * as SecureStore from 'expo-secure-store'

// The JWT is the only thing worth protecting at rest on the device, so it goes
// through SecureStore (Keychain/Keystore) rather than AsyncStorage.
const TOKEN_KEY = 'flotr_player_token'

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY)

export const setToken = (token: string | null) =>
  token ? SecureStore.setItemAsync(TOKEN_KEY, token) : SecureStore.deleteItemAsync(TOKEN_KEY)
