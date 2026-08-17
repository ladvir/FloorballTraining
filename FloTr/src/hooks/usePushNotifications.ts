import { useCallback, useState } from 'react'
import { notificationsApi } from '../api/notifications.api'

const STORAGE_KEY = 'flotr_push_enabled'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const isSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  const setSubscribed = (value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value))
    setIsSubscribed(value)
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) throw new Error('push-not-supported')

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('permission-denied')

    const registration = await navigator.serviceWorker.ready
    const { publicKey } = await notificationsApi.getVapidPublicKey()
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    const json = subscription.toJSON()
    await notificationsApi.pushSubscribe({
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    })

    setSubscribed(true)
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      setSubscribed(false)
      return
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      setSubscribed(false)
      return
    }

    await subscription.unsubscribe()
    await notificationsApi.pushUnsubscribe(subscription.endpoint)
    setSubscribed(false)
  }, [isSupported])

  return { isSubscribed, isSupported, subscribe, unsubscribe }
}
