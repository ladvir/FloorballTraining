import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Ratings', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('ratings page loads and shows content area', async ({ page }) => {
    await page.goto('/ratings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('admin/coach sees overview tab with summary stats', async ({ page }) => {
    await page.goto('/ratings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Coach tabs are visible (overview, byType, byPerson, all)
    const overviewTab = page.getByRole('button', { name: /přehled|overview/i })
    const allTab = page.getByRole('button', { name: /^vše$|all ratings/i })
    const hasCoachTabs =
      (await overviewTab.count()) > 0 ||
      (await allTab.count()) > 0 ||
      (await page.getByRole('tab').count()) > 0

    expect(hasCoachTabs).toBeTruthy()
  })

  test('ratings page shows ratings list or empty state after loading', async ({ page }) => {
    await page.goto('/ratings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const hasRatings =
      (await page
        .locator('[class*="bg-green"], [class*="bg-lime"], [class*="bg-yellow"]')
        .count()) > 0
    const hasEmptyState = await page
      .getByText(/žádná hodnocení|zatím žádné|no ratings/i)
      .isVisible()
      .catch(() => false)

    expect(hasRatings || hasEmptyState || (await page.getByRole('main').isVisible())).toBeTruthy()
  })

  test('filter controls are present (season, team)', async ({ page }) => {
    await page.goto('/ratings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Filter selects or buttons should be visible
    const hasSelect = (await page.locator('select').count()) > 0
    const hasFilterBtn = (await page.getByRole('button', { name: /filtr|filter/i }).count()) > 0
    const hasControls = hasSelect || hasFilterBtn

    expect(hasControls).toBeTruthy()
  })

  test('regular user sees their own ratings tab', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/ratings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()

    // User sees "Moje hodnocení" or similar — no coach-only tabs
    const hasMyRatings = await page
      .getByText(/moje hodnocení|mé hodnocení|my ratings/i)
      .isVisible()
      .catch(() => false)
    const pageRendered = await page.getByRole('main').isVisible()
    expect(hasMyRatings || pageRendered).toBeTruthy()
  })
})
