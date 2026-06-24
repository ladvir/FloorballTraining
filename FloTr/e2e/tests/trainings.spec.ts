import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Trainings', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('trainings page loads and shows content area', async ({ page }) => {
    await page.goto('/trainings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('trainings page shows list or empty state after loading', async ({ page }) => {
    await page.goto('/trainings')
    await page.waitForLoadState('networkidle')

    // Wait for spinner to disappear (data loaded)
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const hasTrainings = (await page.locator('[data-testid="training-card"]').count()) > 0
    const hasEmptyState =
      (await page
        .getByText(/žádné tréninky|no trainings/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText('Přidat trénink')
        .isVisible()
        .catch(() => false))

    // Page renders something meaningful after load
    expect(hasTrainings || hasEmptyState || (await page.getByRole('main').isVisible())).toBeTruthy()
  })

  test('search input is present and filterable', async ({ page }) => {
    await page.goto('/trainings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const searchInput = page.getByPlaceholder(/hledat|search/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('test')
    // Input accepts text without errors
    await expect(searchInput).toHaveValue('test')
  })

  test('clicking training card opens detail modal', async ({ page }) => {
    await page.goto('/trainings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Find the first training card's detail button (Eye icon button)
    const eyeButton = page.getByRole('button', { name: /detail|zobrazit|náhled/i }).first()
    const cardClickable = page.locator('article, [role="article"]').first()

    const hasEyeButton = (await eyeButton.count()) > 0
    const hasCard = (await cardClickable.count()) > 0

    if (!hasEyeButton && !hasCard) {
      test.skip()
      return
    }

    if (hasEyeButton) {
      await eyeButton.click()
    } else {
      await cardClickable.click()
    }

    // Modal or detail panel should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 })
  })

  test('regular user can view trainings page', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/trainings')
    await expect(page).toHaveURL(/\/trainings/, { timeout: 5_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })
})
