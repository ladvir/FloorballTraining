import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const getVapidPublicKey = vi.fn()
const pushSubscribe = vi.fn()
const pushUnsubscribe = vi.fn()

vi.mock('../api/notifications.api', () => ({
  notificationsApi: {
    getVapidPublicKey: (...args: unknown[]) => getVapidPublicKey(...args),
    pushSubscribe: (...args: unknown[]) => pushSubscribe(...args),
    pushUnsubscribe: (...args: unknown[]) => pushUnsubscribe(...args),
  },
}))

import { usePushNotifications } from './usePushNotifications'

const STORAGE_KEY = 'flotr_push_enabled'

/** Stubs navigator.serviceWorker + window.PushManager so isSupported is true. */
function stubServiceWorker(
  existingSubscription: { endpoint: string; unsubscribe: () => Promise<boolean> } | null
) {
  const pushManager = {
    subscribe: vi.fn().mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p-key', auth: 'a-key' },
      }),
    }),
    getSubscription: vi.fn().mockResolvedValue(existingSubscription),
  }
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager }) },
  })
  vi.stubGlobal('PushManager', class {})
  return pushManager
}

describe('usePushNotifications', () => {
  beforeEach(() => {
    localStorage.clear()
    getVapidPublicKey.mockReset().mockResolvedValue({
      publicKey:
        'BNbnB-0HFredEOZBlWLhAO6slZ-hX4tL3PkaHHtvN0DIUtfn4u6-04lEBnaN6nxW7sDrpCC6vuz3VvsDiLd10OY',
    })
    pushSubscribe.mockReset()
    pushUnsubscribe.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error test cleanup — jsdom does not define this by default
    delete navigator.serviceWorker
  })

  it('reads persisted subscription state from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const { result } = renderHook(() => usePushNotifications())
    expect(result.current.isSubscribed).toBe(true)
  })

  it('subscribe() rejects and skips the API call when permission is denied', async () => {
    stubServiceWorker(null)
    vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('denied') })

    const { result } = renderHook(() => usePushNotifications())
    await expect(
      act(async () => {
        await result.current.subscribe()
      })
    ).rejects.toThrow('permission-denied')

    expect(pushSubscribe).not.toHaveBeenCalled()
    expect(result.current.isSubscribed).toBe(false)
  })

  it('subscribe() registers the subscription and persists state when permission is granted', async () => {
    stubServiceWorker(null)
    vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('granted') })

    const { result } = renderHook(() => usePushNotifications())
    await act(async () => {
      await result.current.subscribe()
    })

    expect(pushSubscribe).toHaveBeenCalledWith({
      endpoint: 'https://push.example/abc',
      p256dh: 'p-key',
      auth: 'a-key',
    })
    expect(result.current.isSubscribed).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('unsubscribe() is a no-op when there is no existing subscription', async () => {
    stubServiceWorker(null)
    const { result } = renderHook(() => usePushNotifications())

    await act(async () => {
      await result.current.unsubscribe()
    })

    expect(pushUnsubscribe).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('unsubscribe() removes an existing subscription via the API', async () => {
    const existing = {
      endpoint: 'https://push.example/abc',
      unsubscribe: vi.fn().mockResolvedValue(true),
    }
    stubServiceWorker(existing)
    localStorage.setItem(STORAGE_KEY, 'true')

    const { result } = renderHook(() => usePushNotifications())
    await act(async () => {
      await result.current.unsubscribe()
    })

    expect(existing.unsubscribe).toHaveBeenCalledTimes(1)
    expect(pushUnsubscribe).toHaveBeenCalledWith('https://push.example/abc')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
  })
})
