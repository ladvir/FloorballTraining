import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Authorization — route guards', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  // Flow 5: Admin can access admin-only routes
  test('Admin sees /clubs (admin-only route)', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.goto('/clubs')
    // Should stay on /clubs, not redirected
    await expect(page).toHaveURL(/\/clubs/, { timeout: 5_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  // Flow 6: Regular user redirected from admin-only route
  test('User is redirected from /clubs to /', async ({ page }) => {
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/clubs')
    // AdminRoute redirects non-admins to /
    await expect(page).not.toHaveURL(/\/clubs/, { timeout: 5_000 })
  })

  // Flow 7: Authenticated user can view trainings list
  test('authenticated user can access /trainings', async ({ page }) => {
    await loginViaUi(page, USERS.user.email, USERS.user.password)
    await page.goto('/trainings')
    await expect(page).toHaveURL(/\/trainings/, { timeout: 5_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })
})
