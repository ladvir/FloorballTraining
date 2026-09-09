import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { notificationsApi } from '../api'

// Heads-up banner + sound even when the app is foregrounded (reminders are time-sensitive).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const projectId =
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
  (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId

// Remember the token we handed the server so logout can unregister exactly it.
let registeredToken: string | null = null

/**
 * Best-effort: request permission, fetch this install's Expo push token, register it with the API.
 * No-op on simulators / when permission is denied. Safe to call on every login.
 */
export async function registerPushTokenAsync(): Promise<void> {
  try {
    if (!Device.isDevice) return

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Výchozí',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const current = await Notifications.getPermissionsAsync()
    let granted = current.granted
    if (!granted && current.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted
    }
    if (!granted) return

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    if (!token || token === registeredToken) return

    await notificationsApi.registerDevice(token)
    registeredToken = token
  } catch {
    // Push is a nice-to-have; never block the app on it.
  }
}

/** Stop the server pushing to this device — call before clearing the auth tokens on logout. */
export async function unregisterPushTokenAsync(): Promise<void> {
  const token = registeredToken
  if (!token) return
  registeredToken = null
  try {
    await notificationsApi.unregisterDevice(token)
  } catch {
    // Best-effort.
  }
}
