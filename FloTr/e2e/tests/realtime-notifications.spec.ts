import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Real-time notifications via SignalR — Sprint 6 Feat1 (#36)
 *
 * These tests are skipped until:
 *   - NotificationHub is registered in the .NET API with JWT auth
 *   - useNotificationsHub() hook is implemented in FloTr
 *   - The Navbar refetchInterval polling is replaced by hub invalidation
 *
 * Remove test.skip() calls as features land.
 *
 * Note: SignalR tests use Playwright's network interception and page.evaluate()
 * to inject mock hub events, avoiding the need for a second browser session.
 */

test.describe('Real-time notifications — SignalR', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test.skip('notification badge updates without page refresh when hub event arrives', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Read initial badge count
    const badge = page.locator('button[aria-label="Upozornění"] span')
    const initialText = (await badge.isVisible()) ? await badge.textContent() : '0'
    const initialCount = parseInt(initialText ?? '0') || 0

    // Simulate a 'notification' event arriving via SignalR hub
    // The hub hook should call queryClient.invalidateQueries(['notifications-unread-count'])
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('__signalr_notification', {
          detail: {
            id: 9999,
            type: 'NewUserRegistered',
            title: 'Test notification',
            message: 'Simulated via E2E',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        })
      )
    })

    // Badge should reflect the new unread count (without page reload)
    await expect(badge).toBeVisible({ timeout: 5_000 })
    const newText = await badge.textContent()
    const newCount = parseInt(newText ?? '0') || 0
    expect(newCount).toBeGreaterThan(initialCount)
  })

  test.skip('toast appears when new notification arrives via SignalR', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Trigger a simulated notification hub event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('__signalr_notification', {
          detail: {
            id: 9998,
            type: 'NewUserRegistered',
            title: 'Nový uživatel',
            message: 'Byl zaregistrován nový uživatel.',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        })
      )
    })

    // Toast notification should appear (F9 #31 integration)
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Nový uživatel')).toBeVisible({ timeout: 5_000 })
  })

  test.skip('hub reconnects automatically after connection drop', async ({ page, context }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Drop network to simulate hub disconnect
    await context.setOffline(true)
    await page.waitForTimeout(2_000)

    // Restore network — hub should reconnect automatically
    await context.setOffline(false)
    await page.waitForTimeout(5_000)

    // App should still be functional (no error boundary, hub reconnected)
    await expect(page.getByText(/something went wrong|nastala chyba/i)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Upozornění' })).toBeVisible()
  })

  test.skip('appointment.changed event triggers a toast and refreshes the appointments query', async ({
    page,
  }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('__signalr_appointment_changed', {
          detail: { appointmentId: 1, reason: 'time_changed' },
        })
      )
    })

    // Toast about changed appointment
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
  })
})
