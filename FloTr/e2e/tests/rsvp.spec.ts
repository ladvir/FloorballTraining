import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * RSVP / attendance confirmation — Sprint 6 Feat5 (#40)
 *
 * These tests are skipped until EventAttendance backend + AttendanceWidget
 * frontend are implemented. Remove test.skip() calls as features land.
 *
 * Requires:
 *   - GET /appointments/:id/attendance
 *   - PUT /appointments/:id/attendance  (status: Yes | No | Maybe)
 *   - PUT /appointments/:id/attendance/bulk  (Coach/HeadCoach only)
 */

test.describe('RSVP — attendance confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test.skip('attendance widget is visible in appointment detail', async ({ page }) => {
    // Navigate to an existing appointment detail page
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    // Open the first appointment detail
    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()

    // AttendanceWidget should be visible in the detail
    await expect(page.getByTestId('attendance-widget')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('heading', { name: /účast/i })).toBeVisible()
  })

  test.skip('user can confirm attendance with Yes', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()

    const yesButton = page.getByRole('button', { name: /zúčastním se|ano/i })
    await expect(yesButton).toBeVisible({ timeout: 8_000 })
    await yesButton.click()

    // Button should become active/highlighted after selection
    await expect(yesButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 })
  })

  test.skip('user can change attendance status from Yes to No', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()

    // Set to Yes first
    await page.getByRole('button', { name: /zúčastním se|ano/i }).click()
    await page.waitForTimeout(500)

    // Then change to No
    const noButton = page.getByRole('button', { name: /nezúčastním se|ne/i })
    await noButton.click()
    await expect(noButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 })
  })

  test.skip('coach sees attendance summary counts (Yes / No / Maybe)', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()

    // Attendance summary with counts should be visible for coach/admin
    await expect(page.getByTestId('attendance-summary')).toBeVisible({ timeout: 8_000 })
    // Summary should contain at least one number
    await expect(page.getByTestId('attendance-summary')).toHaveText(/\d+/, { timeout: 5_000 })
  })

  test.skip('coach can perform bulk attendance update after event', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()

    const bulkButton = page.getByRole('button', { name: /hromadná docházka|zaznamenat přítomné/i })
    await expect(bulkButton).toBeVisible({ timeout: 8_000 })
    await bulkButton.click()

    // Bulk update modal/panel opens
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })
  })
})
