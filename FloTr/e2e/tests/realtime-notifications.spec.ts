import { test, expect, type Page } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Real-time notifications — SignalR E2E tests (#36)
 *
 * Prerequisites:
 *   - .NET API running in Development mode (enables POST /notifications/ping)
 *   - FloTr dev server running on port 3000
 *
 * The "ping" endpoint creates a notification for the authenticated user and
 * immediately pushes it via the NotificationHub.  Tests use this to verify
 * the full path:  API → SignalR hub → WebSocket → React query invalidation → UI update.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

/** Call POST /api/notifications/ping from within the browser context so the
 *  in-memory JWT (set by axios / setAccessToken) is forwarded correctly. */
async function triggerPing(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const stored = localStorage.getItem('flotr_user')
    const token: string = stored ? (JSON.parse(stored)?.token ?? '') : ''
    if (!token) return false
    const res = await fetch('/api/notifications/ping', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok || res.status === 204
  })
}

/** Returns the numeric unread count reported by the API right now. */
async function apiUnreadCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const stored = localStorage.getItem('flotr_user')
    const token: string = stored ? (JSON.parse(stored)?.token ?? '') : ''
    const res = await fetch('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    return json?.count ?? 0
  })
}

/** Mark all current notifications as read so tests start from a clean state. */
async function markAllRead(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const stored = localStorage.getItem('flotr_user')
    const token: string = stored ? (JSON.parse(stored)?.token ?? '') : ''
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  })
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Real-time notifications — SignalR', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  // ── 1. SignalR WebSocket connection ───────────────────────────────────────

  test('SignalR hub WebSocket connects after login', async ({ page }) => {
    // Register the listener before login so we catch the connection that
    // the useNotificationsHub hook establishes when AppLayout mounts.
    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('hubs/notifications'),
      timeout: 15_000,
    })

    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    // Dashboard is now shown; hook should have started the connection.

    const ws = await wsPromise
    expect(ws.url()).toContain('hubs/notifications')
    expect(ws.isClosed()).toBe(false)
  })

  test('negotiate request succeeds (HTTP 200) after login', async ({ page }) => {
    // Capture the /negotiate HTTP request that SignalR makes before upgrading
    // to WebSocket.  A non-200 means the hub is not registered or JWT auth fails.
    const negotiateRes = page.waitForResponse(
      (res) => res.url().includes('/hubs/notifications/negotiate'),
      { timeout: 15_000 }
    )

    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    const res = await negotiateRes
    expect(res.status()).toBe(200)
  })

  // ── 2. End-to-end push delivery ───────────────────────────────────────────

  test('notification badge appears without page refresh after ping', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.waitForLoadState('networkidle')

    // Clean slate: mark all existing notifications as read so badge starts at 0.
    await markAllRead(page)

    // Wait for any pending React Query refetch to settle so the badge
    // reflects the cleared state before we push the new notification.
    await expect(page.locator('[data-testid="notification-badge"]')).not.toBeVisible({
      timeout: 5_000,
    })

    // Wait for SignalR to connect (hub must be up before push arrives).
    await page.waitForTimeout(1_000)

    // Trigger a server-side push via the Development-only ping endpoint.
    const ok = await triggerPing(page)
    expect(ok, 'POST /notifications/ping must succeed (check API is in Development mode)').toBe(
      true
    )

    // The SignalR "notification" event should fire → queryClient.invalidateQueries
    // → GET /notifications/unread-count → badge renders.  All without any refresh.
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible({ timeout: 8_000 })
  })

  test('badge count increments by 1 for each push (no page refresh)', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.waitForLoadState('networkidle')

    await markAllRead(page)
    await page.waitForTimeout(1_000)

    // Read what the badge shows BEFORE the push (should be hidden = 0).
    const getBadgeCount = () =>
      page
        .locator('[data-testid="notification-badge"]')
        .getAttribute('data-count')
        .then((v) => (v ? parseInt(v) : 0))
        .catch(() => 0)

    const before = await getBadgeCount()

    await triggerPing(page)

    // Badge should become visible and count should increase.
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible({ timeout: 8_000 })
    const after = await getBadgeCount()
    expect(after).toBeGreaterThan(before)
  })

  test('pushing two notifications increases count by 2', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.waitForLoadState('networkidle')

    await markAllRead(page)
    await page.waitForTimeout(1_000)

    // Initial API count = 0 after markAllRead.
    const countBefore = await apiUnreadCount(page)

    await triggerPing(page)
    await page.waitForTimeout(300) // let hub deliver first message
    await triggerPing(page)

    // Wait for both pushes to arrive and badge to settle.
    await page.waitForTimeout(3_000)

    const countAfter = await apiUnreadCount(page)
    expect(countAfter).toBe(countBefore + 2)
  })

  // ── 3. Diagnostic / regression guards ─────────────────────────────────────

  test('ping endpoint is available in Development mode', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    const status = await page.evaluate(async () => {
      const stored = localStorage.getItem('flotr_user')
      const token: string = stored ? (JSON.parse(stored)?.token ?? '') : ''
      const res = await fetch('/api/notifications/ping', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.status
    })

    // 204 = OK; 404 = API not in Development mode (check ASPNETCORE_ENVIRONMENT)
    expect(
      status,
      'ping returned 404 — is the API running with ASPNETCORE_ENVIRONMENT=Development?'
    ).toBe(204)
  })

  test('hub reconnects after brief network drop', async ({ page, context }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.waitForLoadState('networkidle')

    // Confirm initial connection.
    await page
      .waitForResponse((res) => res.url().includes('/hubs/notifications/negotiate'), {
        timeout: 10_000,
      })
      .catch(() => null) // may already be done; ignore timeout

    // Simulate a network drop then restore.
    await context.setOffline(true)
    await page.waitForTimeout(2_000)
    await context.setOffline(false)

    // Give withAutomaticReconnect() time to re-establish the connection.
    await page.waitForTimeout(6_000)

    // After reconnect, a ping should still update the badge.
    await markAllRead(page)
    await triggerPing(page)
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible({
      timeout: 10_000,
    })
  })
})
