import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Player statistics & Canadian scoring — Sprint 8 Feat14 (#47)
 *
 * These tests are skipped until:
 *   - Stats tab added to MemberDetailPage
 *   - GET /members/:id/stats/scoring?seasonId= endpoint
 *   - GET /members/:id/stats/tests?seasonId= endpoint (with team average comparison)
 *   - Canadian scoring table component
 *   - Recharts trend graph in MemberDetailPage
 *
 * Some tests overlap with existing PlayerTestProfilePage coverage — those
 * tests verify the NEW aggregated view, not the existing page.
 *
 * Remove test.skip() as features land.
 */

test.describe('Player statistics', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  async function openFirstMemberStats(page: import('@playwright/test').Page) {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const btn = page.locator('table tbody tr td button').first()
    if ((await btn.count()) === 0) return false
    await btn.click()
    await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
    await page.waitForLoadState('networkidle')
    return true
  }

  test.skip('MemberDetailPage has a "Statistiky" tab', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await expect(page.getByRole('tab', { name: /statistiky|stats|výkonnost/i })).toBeVisible({
      timeout: 5_000,
    })
  })

  test.skip('Stats tab loads without error', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /statistiky|stats/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test.skip('Canadian scoring table is visible with goals/assists columns', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /statistiky|stats/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/kanadské bodování|scoring|góly|goals/i).first()).toBeVisible({
      timeout: 5_000,
    })

    // Table with goals and assists columns
    const hasTable = (await page.locator('table').count()) > 0
    const hasEmpty = await page
      .getByText(/žádné statistiky|no stats|žádné zápasy/i)
      .isVisible()
      .catch(() => false)

    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test.skip('year/season filter changes displayed scoring data', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /statistiky|stats/i }).click()
    await page.waitForLoadState('networkidle')

    const seasonFilter = page.getByRole('combobox', { name: /sezóna|rok|year/i })
    await expect(seasonFilter).toBeVisible({ timeout: 5_000 })

    const options = await seasonFilter.locator('option').count()
    if (options > 1) {
      await seasonFilter.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('main')).toBeVisible()
    }
  })

  test.skip('test results section shows team average comparison', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /statistiky|stats/i }).click()
    await page.waitForLoadState('networkidle')

    // Team average comparison row/badge should be visible alongside test results
    await expect(page.getByText(/průměr týmu|team average|porovnání/i).first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test.skip('performance trend chart is rendered (Recharts)', async ({ page }) => {
    const found = await openFirstMemberStats(page)
    if (!found) {
      test.skip()
      return
    }

    await page.getByRole('tab', { name: /statistiky|stats/i }).click()
    await page.waitForLoadState('networkidle')

    // Recharts renders SVG elements
    const chartSvg = page.locator('svg.recharts-surface, [class*="recharts"]')
    const hasChart = (await chartSvg.count()) > 0
    const hasNoData = await page
      .getByText(/nedostatek dat|not enough data|žádné záznamy/i)
      .isVisible()
      .catch(() => false)

    expect(hasChart || hasNoData).toBeTruthy()
  })
})
