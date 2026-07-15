import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * PWA — service worker, offline support, install prompt — Sprint 6 F6 (#28)
 *
 * The manifest and service worker tests remain skipped: the SW and manifest
 * are only emitted by the production build (devOptions.enabled = false).
 * Run those against a preview/staging server:
 *   npm run build && npm run preview
 */

test.describe('PWA — manifest and service worker', () => {
  test.skip('web app manifest is served and contains required fields', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest')
    expect(response?.status()).toBe(200)

    const manifest = await response?.json()
    expect(manifest.display).toBe('standalone')
    expect(manifest.name).toBeTruthy()
    expect(manifest.icons?.length).toBeGreaterThan(0)
    // Required icon sizes
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  test.skip('service worker is registered after page load', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration('/')
      return !!registration
    })
    expect(swRegistered).toBe(true)
  })

  test.skip('cached assets are served offline (dashboard fallback)', async ({ page, context }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    // Visit dashboard to warm the cache
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)

    // Reload — page should still render from cache
    await page.reload()
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 })

    await context.setOffline(false)
  })

  test('offline banner is shown when network is unavailable', async ({ page, context }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)
    // Trigger the online/offline event detection
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))

    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/nejste online|offline/i)).toBeVisible()

    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5_000 })
  })

  test('install prompt banner is shown after beforeinstallprompt event', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    await page.goto('/dashboard')

    // Simulate the beforeinstallprompt event that browsers fire when PWA is installable
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })

    await expect(page.getByTestId('install-prompt')).toBeVisible({ timeout: 5_000 })
    await expect(
      page.getByRole('button', { name: /instalovat|inštalovať|install|zainstaluj/i })
    ).toBeVisible()
  })
})
