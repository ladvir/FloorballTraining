import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('notifications page loads and shows heading', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: 'Upozornění' })).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('notifications page shows list or empty state', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')

    const hasNotifications = await page
      .locator('[class*="border-gray"][class*="rounded-lg"]')
      .count()
    const hasEmpty = await page
      .getByText('Žádná upozornění')
      .isVisible()
      .catch(() => false)

    // Either notifications exist or the empty state is shown
    expect(hasNotifications > 0 || hasEmpty).toBeTruthy()
  })

  test('navbar bell button is visible and navigates to notifications', async ({ page }) => {
    await page.goto('/dashboard')
    const bellButton = page.getByRole('button', { name: 'Upozornění' })
    await expect(bellButton).toBeVisible()
    await bellButton.click()
    await expect(page).toHaveURL(/\/notifications/, { timeout: 5_000 })
  })

  test('mark all as read button appears only when unread notifications exist', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')

    const markAllButton = page.getByRole('button', { name: 'Označit vše jako přečtené' })
    const unreadItems = page.locator('.bg-sky-50')
    const unreadCount = await unreadItems.count()

    if (unreadCount > 0) {
      await expect(markAllButton).toBeVisible()
    } else {
      await expect(markAllButton).not.toBeVisible()
    }
  })

  test('clicking unread notification marks it as read', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')

    const unreadItem = page.locator('.bg-sky-50').first()
    const hasUnread = (await unreadItem.count()) > 0

    if (!hasUnread) {
      test.skip()
      return
    }

    await unreadItem.click()
    // After click, item should transition from sky-50 to white background (read state)
    await expect(unreadItem).not.toHaveClass(/bg-sky-50/, { timeout: 5_000 })
  })
})
