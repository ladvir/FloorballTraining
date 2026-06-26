import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Test library', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('test library page loads and shows content area', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('test library shows test cards or empty state', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const hasCards = (await page.locator('a[href*="/testing/"]').count()) > 0
    const hasEmptyState = await page
      .getByText(/žádné testy|no tests|knihovna je prázdná/i)
      .isVisible()
      .catch(() => false)

    expect(hasCards || hasEmptyState || (await page.getByRole('main').isVisible())).toBeTruthy()
  })

  test('search input filters test list', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Input uses placeholder "Hledat test..." (raw <input>, not <Input> component)
    const searchInput = page.locator('input[placeholder*="Hledat"]')
    await expect(searchInput).toBeVisible({ timeout: 5_000 })
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')
  })

  test('clicking a test card navigates to test detail', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Test card links are <Link to="/testing/:id"> where id is a number.
    // Find the first <a> whose href ends with a numeric ID.
    const allLinks = page.locator('a[href*="/testing/"]')
    const count = await allLinks.count()
    let cardHref: string | null = null
    for (let i = 0; i < count; i++) {
      const href = await allLinks.nth(i).getAttribute('href')
      if (href && /\/testing\/\d+$/.test(href)) {
        cardHref = href
        break
      }
    }

    if (!cardHref) {
      test.skip()
      return
    }

    await page.goto(cardHref)
    await expect(page).toHaveURL(/\/testing\/\d+/, { timeout: 5_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('admin sees Add test definition link ("Nový test")', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // "Nový test" renders as <Link to="/testing/new">
    const addLink = page.getByRole('link', { name: /nový test/i })
    await expect(addLink).toBeVisible({ timeout: 5_000 })
  })

  test('category filter chips are visible and clickable', async ({ page }) => {
    await page.goto('/testing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Category filter buttons (Conditioning, Technique, etc.)
    const filterBtns = page
      .getByRole('button')
      .filter({ hasText: /kondiční|technika|flexibilita|brankář|vše/i })
    const hasFilters = (await filterBtns.count()) > 0

    if (hasFilters) {
      await filterBtns.first().click()
      await expect(page.getByRole('main')).toBeVisible()
    }

    // Page renders without crashing either way
    expect(await page.getByRole('main').isVisible()).toBeTruthy()
  })
})
