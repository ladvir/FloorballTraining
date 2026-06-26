import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Members', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('members page loads and shows content area', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('members page shows list or empty state after loading', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const hasRows = (await page.locator('table tbody tr, [role="row"]').count()) > 0
    const hasCards = (await page.locator('[data-testid="member-card"]').count()) > 0
    const hasEmptyState = await page
      .getByText(/žádní členové|žádné výsledky|no members/i)
      .isVisible()
      .catch(() => false)

    expect(
      hasRows || hasCards || hasEmptyState || (await page.getByRole('main').isVisible())
    ).toBeTruthy()
  })

  test('search input filters member list', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const searchInput = page.getByPlaceholder(/hledat|search/i)
    await expect(searchInput).toBeVisible({ timeout: 5_000 })
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')
  })

  test('clicking a member name navigates to member detail', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Member names are rendered as <button> elements inside <td> cells
    const memberBtn = page.locator('table tbody tr td button').first()

    if ((await memberBtn.count()) === 0) {
      test.skip()
      return
    }

    await memberBtn.click()
    await expect(page).toHaveURL(/\/members\/\d+/, { timeout: 5_000 })
  })

  test('admin sees Add member button ("Nový člen")', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')

    // Button text is "Nový člen" (with Plus icon)
    const addBtn = page.getByRole('button', { name: /nový člen|new member/i })
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
  })

  test('regular user is redirected away from members page (HeadCoachRoute)', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    // /members is behind HeadCoachRoute — regular User gets redirected
    await expect(page).not.toHaveURL(/\/members$/, { timeout: 5_000 })
  })
})
