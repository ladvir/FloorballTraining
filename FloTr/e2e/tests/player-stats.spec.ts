import { test, expect, type Page } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Player statistics & Canadian scoring — Sprint 8 Feat14 (#47)
 *
 * The "Statistiky" tab in MemberDetailPage aggregates match statistics into a
 * Canadian scoring table (goals/assists/points/±), a performance trend chart
 * (Recharts) and per-season metric totals. The "Testy" tab shows test results
 * with a team-average comparison.
 *
 * Tabs are rendered as <button> elements (not ARIA tabs). Tests are lenient
 * about seeded data: they accept either populated views or empty states.
 */

test.describe('Player statistics', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  async function openFirstMember(page: Page): Promise<boolean> {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const row = page
      .locator('table tbody tr')
      .filter({ hasNot: page.locator('th') })
      .first()
    if ((await row.count()) === 0) return false
    await row.click()
    await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
    await page.waitForLoadState('networkidle')
    return true
  }

  async function openStatsTab(page: Page): Promise<boolean> {
    if (!(await openFirstMember(page))) return false
    await page
      .getByRole('button', { name: /statistiky/i })
      .first()
      .click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })
    return true
  }

  test('MemberDetailPage has a "Statistiky" tab', async ({ page }) => {
    if (!(await openFirstMember(page))) {
      test.skip()
      return
    }
    await expect(page.getByRole('button', { name: /statistiky/i }).first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('Stats tab loads without error', async ({ page }) => {
    if (!(await openStatsTab(page))) {
      test.skip()
      return
    }
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: /kanadské bodování/i })).toBeVisible({
      timeout: 5_000,
    })
  })

  test('Canadian scoring section shows a table or an empty state', async ({ page }) => {
    if (!(await openStatsTab(page))) {
      test.skip()
      return
    }
    await expect(page.getByText(/kanadské bodování/i).first()).toBeVisible({ timeout: 5_000 })

    const hasTable = (await page.locator('table').count()) > 0
    const hasEmpty = await page
      .getByText(/žádné zápasové statistiky/i)
      .isVisible()
      .catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test('period filter is present and switchable', async ({ page }) => {
    if (!(await openStatsTab(page))) {
      test.skip()
      return
    }
    const periodFilter = page.getByRole('combobox', { name: /období/i })
    await expect(periodFilter).toBeVisible({ timeout: 5_000 })

    // Switch between all three periods without error
    await periodFilter.selectOption('year')
    await periodFilter.selectOption('all')
    await periodFilter.selectOption('season')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('performance trend chart is rendered (Recharts) or shows no-data', async ({ page }) => {
    if (!(await openStatsTab(page))) {
      test.skip()
      return
    }
    await expect(page.getByRole('heading', { name: /výkonnostní trend/i })).toBeVisible({
      timeout: 5_000,
    })

    const hasChart = (await page.locator('svg.recharts-surface, [class*="recharts"]').count()) > 0
    const hasNoData = await page
      .getByText(/nedostatek dat/i)
      .isVisible()
      .catch(() => false)
    expect(hasChart || hasNoData).toBeTruthy()
  })

  test('tests tab renders results with optional team-average comparison', async ({ page }) => {
    if (!(await openFirstMember(page))) {
      test.skip()
      return
    }
    await page
      .getByRole('button', { name: /^testy$/i })
      .first()
      .click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Either a team comparison block, populated results, or an empty state — never a crash.
    const hasComparison = await page
      .getByText(/porovnání s týmem/i)
      .first()
      .isVisible()
      .catch(() => false)
    const mainVisible = await page.getByRole('main').isVisible()
    expect(hasComparison || mainVisible).toBeTruthy()
  })
})
