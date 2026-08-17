import { test, expect } from '@playwright/test'
import { clearAuthState } from '../helpers/auth'

/**
 * Social login — Sprint 7 Feat10 (#44)
 *
 * These tests are skipped until:
 *   - Google + Microsoft OAuth providers configured in API (Program.cs)
 *   - Client IDs set in appsettings / secrets
 *   - GET /auth/external/{provider} redirect endpoint exists
 *   - GET /auth/external/{provider}/callback processes token + creates AppUser
 *   - Google + Microsoft buttons added to LoginPage.tsx
 *   - Optional: feature flag to hide buttons when OAuth is not configured
 *
 * Note: Full OAuth flow (consent screen) cannot be tested in CI without
 * dedicated test accounts. These tests verify UI presence + redirect initiation.
 *
 * Remove test.skip() as features land.
 */

test.describe('Social login', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.skip('login page shows Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const googleBtn = page.getByRole('button', { name: /google/i })
    await expect(googleBtn).toBeVisible({ timeout: 5_000 })
  })

  test.skip('login page shows Microsoft sign-in button', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const msBtn = page.getByRole('button', { name: /microsoft/i })
    await expect(msBtn).toBeVisible({ timeout: 5_000 })
  })

  test.skip('clicking Google button initiates OAuth redirect', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Intercept navigation — OAuth redirect goes to accounts.google.com
    const navigationPromise = page.waitForURL(/accounts\.google\.com|login\.microsoftonline\.com/, {
      timeout: 10_000,
    })

    await page.getByRole('button', { name: /google/i }).click()

    // Redirect should occur (external URL)
    try {
      await navigationPromise
      expect(true).toBeTruthy() // redirect happened
    } catch {
      // If no redirect (e.g. OAuth not configured), check error handling
      await expect(page.getByText(/není k dispozici|not available|oauth/i)).toBeVisible({
        timeout: 3_000,
      })
    }
  })

  test.skip('clicking Microsoft button initiates OAuth redirect', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const navigationPromise = page.waitForURL(/login\.microsoftonline\.com/, {
      timeout: 10_000,
    })

    await page.getByRole('button', { name: /microsoft/i }).click()

    try {
      await navigationPromise
      expect(true).toBeTruthy()
    } catch {
      await expect(page.getByText(/není k dispozici|not available|oauth/i)).toBeVisible({
        timeout: 3_000,
      })
    }
  })

  test.skip('OAuth callback with valid code sets auth token and redirects to dashboard', async ({
    page,
  }) => {
    // This test requires a real OAuth token from Google/Microsoft test account.
    // In CI, mock the /auth/external/google/callback endpoint to return a JWT.
    // Then verify the SPA stores the token and navigates to /dashboard.

    // Simulate callback with a mocked token via query param
    await page.route('/api/auth/external/google/callback*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          email: 'test@gmail.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['User'],
        }),
      })
    })

    await page.goto('/login?provider=google&code=mock-code')
    await page.waitForLoadState('networkidle')

    // After successful OAuth, user should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })
})
