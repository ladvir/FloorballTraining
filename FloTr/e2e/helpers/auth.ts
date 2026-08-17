import { Page } from '@playwright/test'

/** Logs in via the UI login form and waits for the dashboard to appear. */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Přihlásit se' }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

/** Clears local auth state (localStorage + cookies) without going through UI logout. */
export async function clearAuthState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('flotr_user')
    localStorage.removeItem('flotr_token')
  })
  await page.context().clearCookies()
}
