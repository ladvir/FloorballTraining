import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Attendance tracking — Sprint 8 Feat (#58)
 *
 * These tests are skipped until:
 *   - AppointmentAttendance entity + EF migration
 *   - GET/PUT /appointments/:id/attendance endpoints
 *   - PUT /appointments/:id/attendance/self (self-report)
 *   - GET /members/:id/attendance endpoint
 *   - GET/export /teams/:id/attendance endpoints
 *   - AttendanceModal component in AppointmentDetailPage
 *   - AttendanceSummaryBadge in AppointmentDetailPage
 *   - MemberAttendanceSection in MemberDetailPage
 *   - TeamAttendanceTab in TeamDetailPage
 *
 * Remove test.skip() as features land.
 */

test.describe('Attendance tracking', () => {
  test.describe('Coach — record attendance after event', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page)
      await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    })

    test.skip('coach sees "Zaznamenat docházku" button in team appointment detail', async ({
      page,
    }) => {
      await page.goto('/appointments')
      await page.waitForLoadState('networkidle')

      // Switch to list view and open first appointment
      const listBtn = page.getByRole('button', { name: /seznam|list/i })
      if (await listBtn.isVisible()) await listBtn.click()

      const firstCard = page.locator('[data-testid="appointment-card"]').first()
      if ((await firstCard.count()) === 0) {
        test.skip()
        return
      }
      await firstCard.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })

      await expect(
        page.getByRole('button', { name: /zaznamenat docházku|docházka|attendance/i })
      ).toBeVisible({ timeout: 5_000 })
    })

    test.skip('clicking attendance button opens AttendanceModal with team member list', async ({
      page,
    }) => {
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

      await page.getByRole('button', { name: /zaznamenat docházku|docházka/i }).click()

      // AttendanceModal opens (nested dialog or second dialog)
      const modals = page.locator('[role="dialog"]')
      await expect(modals.last()).toBeVisible({ timeout: 5_000 })

      // Should show at least one member row with status buttons
      await expect(page.getByRole('button', { name: /přítomen|present|✓/i }).first()).toBeVisible({
        timeout: 5_000,
      })
    })

    test.skip('marking member as Present saves and updates summary badge', async ({ page }) => {
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
      await page.getByRole('button', { name: /zaznamenat docházku|docházka/i }).click()

      // Mark first member as Present
      const presentBtn = page.getByRole('button', { name: /přítomen|present/i }).first()
      await expect(presentBtn).toBeVisible({ timeout: 5_000 })
      await presentBtn.click()

      // Save
      await page.getByRole('button', { name: /uložit|save/i }).click()

      // Summary badge updates: "✓ 1" or similar
      await expect(page.getByTestId('attendance-summary-badge')).toContainText(/1/, {
        timeout: 5_000,
      })
    })

    test.skip('coach can add a guest (club member outside team) in AttendanceModal', async ({
      page,
    }) => {
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
      await page.getByRole('button', { name: /zaznamenat docházku|docházka/i }).click()

      // Guest combobox / "Přidat hosta" button
      const addGuestBtn = page.getByRole('button', { name: /přidat hosta|add guest/i })
      await expect(addGuestBtn).toBeVisible({ timeout: 5_000 })
      await addGuestBtn.click()

      // Combobox opens for club member search
      const combobox = page.getByRole('combobox', { name: /hledat člena|search member/i })
      await expect(combobox).toBeVisible({ timeout: 3_000 })
    })

    test.skip('bulk "Mark all present" pre-fills all members as Present', async ({ page }) => {
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
      await page.getByRole('button', { name: /zaznamenat docházku|docházka/i }).click()

      const bulkBtn = page.getByRole('button', {
        name: /označit vše|všichni přítomni|mark all present/i,
      })
      await expect(bulkBtn).toBeVisible({ timeout: 5_000 })
      await bulkBtn.click()

      // All "Present" buttons should now appear active/selected
      const presentBtns = page.getByRole('button', { name: /přítomen|present/i })
      const count = await presentBtns.count()
      expect(count).toBeGreaterThan(0)
    })

    test.skip('regular user does not see attendance button in team appointment detail', async ({
      page,
    }) => {
      await clearAuthState(page)
      await loginViaUi(page, USERS.user.email, USERS.user.password)
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

      await expect(
        page.getByRole('button', { name: /zaznamenat docházku|docházka/i })
      ).not.toBeVisible()
    })
  })

  test.describe('Member attendance history', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page)
      await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    })

    test.skip('MemberDetailPage shows attendance section with history or empty state', async ({
      page,
    }) => {
      await page.goto('/members')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

      const firstRow = page
        .locator('table tbody tr, [role="row"]')
        .filter({ hasNot: page.locator('th') })
        .first()
      if ((await firstRow.count()) === 0) {
        test.skip()
        return
      }
      await firstRow.click()
      await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
      await page.waitForLoadState('networkidle')

      // Attendance section or tab should exist
      await expect(page.getByText(/docházka|attendance/i).first()).toBeVisible({ timeout: 5_000 })
    })

    test.skip('member attendance section shows attendance rate percentage', async ({ page }) => {
      await page.goto('/members')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

      const firstRow = page
        .locator('table tbody tr, [role="row"]')
        .filter({ hasNot: page.locator('th') })
        .first()
      if ((await firstRow.count()) === 0) {
        test.skip()
        return
      }
      await firstRow.click()
      await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
      await page.waitForLoadState('networkidle')

      // Should show percentage or "0 událostí"
      await expect(page.getByText(/%|\d+ událostí|no events/i)).toBeVisible({ timeout: 5_000 })
    })
  })

  test.describe('Team attendance report', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page)
      await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    })

    test.skip('TeamDetailPage shows Attendance tab', async ({ page }) => {
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('tab', { name: /docházka|attendance/i })).toBeVisible({
        timeout: 5_000,
      })
    })

    test.skip('Team attendance tab shows member × event matrix or empty state', async ({
      page,
    }) => {
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')

      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('tab', { name: /docházka|attendance/i }).click()
      await page.waitForLoadState('networkidle')

      const hasMatrix = (await page.locator('table').count()) > 0
      const hasEmpty = await page
        .getByText(/žádné události|no events|docházka nebyla zaznamenána/i)
        .isVisible()
        .catch(() => false)

      expect(hasMatrix || hasEmpty).toBeTruthy()
    })

    test.skip('attendance export button triggers file download', async ({ page }) => {
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')

      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('tab', { name: /docházka|attendance/i }).click()

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10_000 }),
        page.getByRole('button', { name: /export|stáhnout|download/i }).click(),
      ])

      expect(download.suggestedFilename()).toMatch(/\.csv$|\.xlsx$/i)
    })
  })
})
