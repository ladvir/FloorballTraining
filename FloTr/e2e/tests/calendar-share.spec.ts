import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Public calendar share — Sprint 7 Feat6 (#41)
 *
 * These tests are skipped until:
 *   - `PublicCalendarToken` column added to Team entity + EF migration
 *   - GET /public/calendar/:token (JSON, no auth)
 *   - GET /public/calendar/:token.ics (iCal feed, no auth)
 *   - POST /teams/:id/calendar-token (generates/regenerates token, HeadCoach+)
 *   - /share/:token route added to React Router (outside ProtectedRoute)
 *   - Calendar share section added to TeamDetailPage
 *
 * Remove test.skip() as features land.
 */

test.describe('Public calendar share', () => {
  test.describe('authenticated — team detail share section', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page)
      await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    })

    test.skip('calendar share section is visible in TeamDetailPage for coach/admin', async ({
      page,
    }) => {
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')

      // Open first available team
      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(/sdílení kalendáře|calendar share/i)).toBeVisible({
        timeout: 5_000,
      })
    })

    test.skip('generate token button produces a shareable link', async ({ page }) => {
      // Navigate to first team detail
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')
      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      const generateBtn = page.getByRole('button', { name: /vygenerovat|generovat|generate/i })
      await generateBtn.click()
      await page.waitForLoadState('networkidle')

      // A URL containing /share/ should appear somewhere
      await expect(page.getByText(/\/share\//)).toBeVisible({ timeout: 8_000 })
    })

    test.skip('iCal link button is present after token generation', async ({ page }) => {
      await page.goto('/teams')
      await page.waitForLoadState('networkidle')
      const firstTeam = page.locator('a[href*="/teams/"], [data-testid="team-card"]').first()
      if ((await firstTeam.count()) === 0) {
        test.skip()
        return
      }
      await firstTeam.click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('link', { name: /\.ics|ical|google kalend/i })).toBeVisible({
        timeout: 5_000,
      })
    })
  })

  test.describe('unauthenticated — public share page', () => {
    test.skip('/share/:token is accessible without login', async ({ page }) => {
      // Use a placeholder token — real token must come from a seeded team
      await clearAuthState(page)
      await page.goto('/share/test-token-placeholder')
      await page.waitForLoadState('networkidle')

      // Should NOT redirect to /login — public route
      expect(page.url()).not.toContain('/login')

      // Either shows events or "žádné události" or invalid token message
      await expect(page.getByRole('main')).toBeVisible({ timeout: 5_000 })
    })

    test.skip('invalid token shows error message instead of crashing', async ({ page }) => {
      await clearAuthState(page)
      await page.goto('/share/invalid-token-xyz-000')
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(/neplatný|nenalezen|not found|invalid/i)).toBeVisible({
        timeout: 5_000,
      })
    })

    test.skip('iCal endpoint returns text/calendar content type', async ({ page }) => {
      // This test validates the API endpoint directly
      const response = await page.request.get('/api/public/calendar/test-token-placeholder.ics')

      // Token placeholder → 404, but real token must return 200 + correct MIME
      // Replace 404 check with 200 when real token is seeded
      const contentType = response.headers()['content-type'] ?? ''
      const status = response.status()

      expect(status === 200 || status === 404).toBeTruthy()
      if (status === 200) {
        expect(contentType).toContain('text/calendar')
      }
    })
  })
})
