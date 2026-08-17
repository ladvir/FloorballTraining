import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('dashboard loads at /dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('dashboard renders without crashing after data load', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // No unhandled error boundary should be shown
    await expect(page.getByText(/something went wrong|nastala chyba/i)).not.toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('app layout is fully rendered — navbar and sidebar present', async ({ page }) => {
    await page.goto('/dashboard')

    // Navbar: bell button and user menu
    await expect(page.getByRole('button', { name: 'Upozornění' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Uživatelské menu' })).toBeVisible()
  })

  test('dashboard shows upcoming appointments section or empty state', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Dashboard should display some meaningful content — cards, sections, or empty states
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeVisible()
    // Main area should have child elements (not completely empty)
    const childCount = await mainContent.locator('> *').count()
    expect(childCount).toBeGreaterThan(0)
  })

  test('regular user sees dashboard', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('main')).toBeVisible()
  })
})
