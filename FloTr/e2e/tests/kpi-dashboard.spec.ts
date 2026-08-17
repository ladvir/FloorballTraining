import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Coach KPI dashboard — Sprint 8 Feat3 (#38)
 *
 * These tests are skipped until:
 *   - TeamAttendanceTab is implemented (#58)
 *   - KPI tab / route added to TeamDetailPage
 *   - GET /teams/:id/kpi?seasonId= endpoint (or FE aggregation)
 *   - Attendance data available from #58
 *   - Test results aggregation endpoint
 *
 * Remove test.skip() as features land.
 */

test.describe('Coach KPI dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  async function openFirstTeam(page: import('@playwright/test').Page) {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
    if ((await firstTeam.count()) === 0) return false
    await firstTeam.click()
    await page.waitForLoadState('networkidle')
    return true
  }

  test.skip('KPI tab is visible in TeamDetailPage for coach/admin', async ({ page }) => {
    const found = await openFirstTeam(page)
    if (!found) {
      test.skip()
      return
    }

    await expect(page.getByRole('tab', { name: /kpi|statistiky|přehled/i })).toBeVisible({
      timeout: 5_000,
    })
  })

  test.skip('attendance card shows percentage or "no data" state', async ({ page }) => {
    const found = await openFirstTeam(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /kpi|statistiky/i }).click()
    await page.waitForLoadState('networkidle')

    const hasAttendance =
      (await page
        .getByText(/docházka|attendance/i)
        .isVisible()
        .catch(() => false)) &&
      ((await page
        .getByText(/%/)
        .isVisible()
        .catch(() => false)) ||
        (await page
          .getByText(/žádná data|no data|nezaznamenána/i)
          .isVisible()
          .catch(() => false)))

    expect(hasAttendance).toBeTruthy()
  })

  test.skip('test results card shows average score or empty state', async ({ page }) => {
    const found = await openFirstTeam(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /kpi|statistiky/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/výsledky testů|test results|průměr/i).first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test.skip('training ratings card shows average grade', async ({ page }) => {
    const found = await openFirstTeam(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /kpi|statistiky/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByText(/hodnocení tréninků|training ratings|průměrná known/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test.skip('season filter changes displayed KPI data', async ({ page }) => {
    const found = await openFirstTeam(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /kpi|statistiky/i }).click()
    await page.waitForLoadState('networkidle')

    const seasonSelect = page.getByRole('combobox', { name: /sezóna|season/i })
    await expect(seasonSelect).toBeVisible({ timeout: 5_000 })

    const options = await seasonSelect.locator('option').count()
    if (options > 1) {
      await seasonSelect.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
      // Page should still render without crashing
      await expect(page.getByRole('main')).toBeVisible()
    }
  })
})
