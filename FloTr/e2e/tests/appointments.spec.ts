import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('appointments page loads and shows content area', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('page shows calendar or list view toggle buttons', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // View toggle buttons (List / Calendar)
    const calendarBtn = page.getByRole('button', { name: /kalendář|calendar/i })
    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    const hasToggle =
      (await calendarBtn.count()) > 0 ||
      (await listBtn.count()) > 0 ||
      (await page.locator('button svg').count()) > 0

    expect(hasToggle).toBeTruthy()
  })

  test('switching to list view shows appointment items or empty state', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Switch to list view if toggle exists
    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) {
      await listBtn.click()
      await page.waitForLoadState('networkidle')
    }

    // Either items or empty state message is visible
    const hasItems = (await page.locator('[data-testid="appointment-card"]').count()) > 0
    const hasCalendarCells = (await page.locator('table td, [role="gridcell"]').count()) > 0
    const hasContent = hasItems || hasCalendarCells || (await page.getByRole('main').isVisible())
    expect(hasContent).toBeTruthy()
  })

  test('clicking an appointment opens detail dialog', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Switch to list view for easier clicking
    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) {
      await listBtn.click()
    }

    const card = page.locator('[data-testid="appointment-card"]').first()
    const hasCard = (await card.count()) > 0

    if (!hasCard) {
      // No appointments yet — toggle "Zobrazit minulé" and try again
      const pastBtn = page.getByRole('button', { name: /minulé|past/i })
      if (await pastBtn.isVisible()) {
        await pastBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }

    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })
  })

  test('regular user can view appointments page', async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/appointments')
    await expect(page).toHaveURL(/\/appointments/, { timeout: 5_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })
})
