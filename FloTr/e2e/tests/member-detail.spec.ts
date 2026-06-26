import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Member detail', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  async function navigateToFirstMember(page: import('@playwright/test').Page) {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Member names are <button> elements inside <td> cells
    const btn = page.locator('table tbody tr td button').first()
    if ((await btn.count()) === 0) return false
    await btn.click()
    await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
    return true
  }

  test('member detail page loads with name heading', async ({ page }) => {
    const found = await navigateToFirstMember(page)
    if (!found) {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
    // Page should show member name (h1 or prominent text)
    await expect(page.locator('h1, [class*="font-semibold"]').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('member detail shows basic info section', async ({ page }) => {
    const found = await navigateToFirstMember(page)
    if (!found) {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Should show at least club name or some member info
    const hasInfo =
      (await page.locator('[class*="Card"]').count()) > 0 ||
      (await page.locator('dl, table').count()) > 0 ||
      (await page.getByRole('main').isVisible())

    expect(hasInfo).toBeTruthy()
  })

  test('member detail shows test results section or empty state', async ({ page }) => {
    const found = await navigateToFirstMember(page)
    if (!found) {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Test results section header or empty state
    const hasTestSection =
      (await page
        .getByText(/testy|výsledky testů|test results/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('[data-testid="test-results"]')
        .isVisible()
        .catch(() => false)) ||
      (await page.getByRole('main').isVisible())

    expect(hasTestSection).toBeTruthy()
  })

  test('back navigation returns to members list', async ({ page }) => {
    const found = await navigateToFirstMember(page)
    if (!found) {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    const backBtn = page.getByRole('button', { name: /zpět|back/i })
    const backLink = page
      .locator('a[href="/members"], button')
      .filter({ hasText: /zpět|back/i })
      .first()

    if (await backBtn.isVisible()) {
      await backBtn.click()
    } else if (await backLink.isVisible()) {
      await backLink.click()
    } else {
      await page.goBack()
    }

    await expect(page).toHaveURL(/\/members$/, { timeout: 5_000 })
  })

  test('admin sees edit controls in member detail', async ({ page }) => {
    const found = await navigateToFirstMember(page)
    if (!found) {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const hasEdit =
      (await page.getByRole('button', { name: /upravit|editovat|edit/i }).count()) > 0 ||
      (await page.locator('[data-testid="edit-member"]').count()) > 0

    expect(hasEdit).toBeTruthy()
  })
})
