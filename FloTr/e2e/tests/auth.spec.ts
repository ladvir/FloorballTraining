import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  // Flow 1: Successful login
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await expect(page).toHaveURL(/\/dashboard/)
    // The dashboard should show the app layout (sidebar + main content)
    await expect(page.getByRole('main')).toBeVisible()
  })

  // Flow 2: Login failure
  test('login with wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(USERS.admin.email)
    await page.getByLabel('Heslo', { exact: true }).fill('WrongPassword!')
    await page.getByRole('button', { name: 'Přihlásit se' }).click()

    // Error message appears — stays on /login
    await expect(page.getByText(/neplatné přihlašovací|špatné heslo|unauthorized/i)).toBeVisible({
      timeout: 5_000,
    })
    await expect(page).toHaveURL(/\/login/)
  })

  // Flow 3: Logout
  test('logout clears session and redirects to login', async ({ page }) => {
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    // Open the user dropdown, then click logout
    await page.getByRole('button', { name: 'Uživatelské menu' }).click()
    await page.getByRole('button', { name: 'Odhlásit se' }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })

    // flotr_user cleared from localStorage
    const stored = await page.evaluate(() => localStorage.getItem('flotr_user'))
    expect(stored).toBeNull()
  })

  // Flow 4: Unauthenticated redirect
  test('unauthenticated navigation to protected route redirects to /login', async ({ page }) => {
    // Navigate directly to a protected route without being logged in
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
