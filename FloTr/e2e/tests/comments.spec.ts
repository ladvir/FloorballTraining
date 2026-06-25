import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Comments on appointments — Sprint 7 Feat7 (#42, CLOSED — already implemented)
 *
 * These tests are skipped until:
 *   - AppointmentComment entity + migration is in DB
 *   - GET/POST /appointments/:id/comments endpoints exist
 *   - PUT/DELETE /appointments/:id/comments/:commentId exist
 *   - AppointmentDetailPage contains AppointmentCommentSection component
 *   - canEditComment / canDeleteComment logic is enforced (15-min edit window)
 *   - coach-only comments hidden from User role
 *
 * Remove test.skip() as features land.
 */

test.describe('Comments on appointments', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test.skip('comments section is visible in appointment detail', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    // Open the first appointment (list view)
    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) await listBtn.click()

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    // Comments section inside the dialog
    await expect(page.getByRole('heading', { name: /komentáře|comments/i })).toBeVisible({
      timeout: 5_000,
    })
  })

  test.skip('user can add a comment to an appointment', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) await listBtn.click()

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    const commentInput = page.getByPlaceholder(/přidat komentář|add comment/i)
    await expect(commentInput).toBeVisible({ timeout: 5_000 })
    await commentInput.fill('E2E test komentář')

    const sendBtn = page.getByRole('button', { name: /odeslat|přidat|send|add/i })
    await sendBtn.click()

    // New comment appears in list
    await expect(page.getByText('E2E test komentář')).toBeVisible({ timeout: 8_000 })
  })

  test.skip('user can edit their own comment within 15 minutes', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) await listBtn.click()

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    // Edit button should be present on own comment
    const editBtn = page.getByRole('button', { name: /upravit|editovat|edit/i }).first()
    await expect(editBtn).toBeVisible({ timeout: 5_000 })
    await editBtn.click()

    const editInput = page.getByRole('textbox').last()
    await editInput.fill('Upravený komentář')
    await page.getByRole('button', { name: /uložit|save/i }).click()

    await expect(page.getByText('Upravený komentář')).toBeVisible({ timeout: 5_000 })
  })

  test.skip('coach-only comment is not visible to regular user role', async ({ page }) => {
    // First, admin adds a coach-only comment
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) await listBtn.click()

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    // Toggle coach-only mode
    const coachOnlyToggle = page.getByRole('checkbox', { name: /pouze pro trenéry|coach.only/i })
    await coachOnlyToggle.check()
    await page.getByPlaceholder(/přidat komentář|add comment/i).fill('Interní poznámka pro trenéry')
    await page.getByRole('button', { name: /odeslat|send/i }).click()

    // Log in as regular user and verify comment is hidden
    await page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /zavřít|close/i })
      .click()
    await clearAuthState(page)
    await loginViaUi(page, USERS.user.email, USERS.user.password)

    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')
    const listBtnUser = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtnUser.isVisible()) await listBtnUser.click()
    await page.locator('[data-testid="appointment-card"]').first().click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    await expect(page.getByText('Interní poznámka pro trenéry')).not.toBeVisible()
  })

  test.skip('star rating widget shows 1-5 stars and submits correctly', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    const listBtn = page.getByRole('button', { name: /seznam|list/i })
    if (await listBtn.isVisible()) await listBtn.click()

    const firstCard = page.locator('[data-testid="appointment-card"]').first()
    if ((await firstCard.count()) === 0) {
      test.skip()
      return
    }
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

    // Star rating widget
    const stars = page.locator('[data-testid="star-rating"] button, [aria-label*="hvězd"]')
    await expect(stars).toHaveCount(5, { timeout: 5_000 })

    // Click 4th star
    await stars.nth(3).click()
    await expect(stars.nth(3)).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 })
  })
})
