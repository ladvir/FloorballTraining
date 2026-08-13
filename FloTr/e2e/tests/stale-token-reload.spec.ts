import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Regression for a stale-token race on cold reload: `ProtectedRoute` used to trust the
 * mere *presence* of a token restored from `localStorage` (which may be expired long after
 * the last visit) instead of checking its `exp` claim, so the app rendered — and fired
 * `/auth/me`, the notifications hub negotiate, and `/notifications/unread-count` — with an
 * expired token before a fresh one was obtained. It now decodes `exp` and only skips the
 * refresh round-trip when the cached token is still actually valid.
 */
test.describe('Reload with an expired persisted token', () => {
  test('refreshes before rendering instead of firing requests with the expired token', async ({
    page,
  }) => {
    await clearAuthState(page)
    // Force Czech regardless of the browser's default locale — loginViaUi's selectors are Czech-only.
    await page.evaluate(() => localStorage.setItem('flotr_lang', 'cs'))
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    // Replace the persisted token with a well-formed but expired JWT (exp = 1h ago), as if
    // the browser had been closed past the access token's lifetime before this reload.
    await page.evaluate(() => {
      const raw = localStorage.getItem('flotr_user')
      if (!raw) return
      const user = JSON.parse(raw)
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }))
      user.token = `${header}.${payload}.`
      localStorage.setItem('flotr_user', JSON.stringify(user))
    })

    const unauthorizedRequests: string[] = []
    page.on('response', (res) => {
      if (res.status() === 401) unauthorizedRequests.push(res.url())
    })

    await page.reload()
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 })
    await page.waitForLoadState('networkidle')

    expect(unauthorizedRequests).toEqual([])
  })
})
