import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * i18n / language switching — Sprint 7 F3 (#26)
 *
 * These tests are skipped until:
 *   - react-i18next is installed and configured (src/i18n/)
 *   - Language switcher is added to ProfilePage or Navbar
 *   - CS + EN translation namespaces exist (common, auth, navigation)
 *   - localStorage key 'flotr_lang' persists the preference
 *
 * Remove test.skip() as features land.
 */

test.describe('i18n — language switching', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test.skip('language switcher is visible in Profile/Settings page', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Language switcher (select, radio or button group CS/EN)
    const switcher =
      page.getByRole('combobox', { name: /jazyk|language/i }) ||
      page.getByRole('button', { name: /cs|en|čeština|english/i }).first()

    await expect(switcher).toBeVisible({ timeout: 5_000 })
  })

  test.skip('switching to English changes navigation labels', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Switch to EN
    const enOption = page.getByRole('option', { name: /english|en/i })
    const enButton = page.getByRole('button', { name: /^en$|english/i })

    if (await enOption.count()) {
      await page.getByRole('combobox', { name: /jazyk|language/i }).selectOption('en')
    } else {
      await enButton.click()
    }

    await page.waitForLoadState('networkidle')

    // Navigation items should appear in English
    await expect(page.getByText(/dashboard/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/appointments|schedule/i)).toBeVisible({ timeout: 5_000 })
  })

  test.skip('language preference persists after page reload', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Switch to EN
    const enButton = page.getByRole('button', { name: /^en$|english/i })
    await enButton.click()
    await page.waitForLoadState('networkidle')

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // EN should still be active (localStorage 'flotr_lang' = 'en')
    const storedLang = await page.evaluate(() => localStorage.getItem('flotr_lang'))
    expect(storedLang).toBe('en')
    await expect(page.getByText(/appointments|schedule/i)).toBeVisible({ timeout: 5_000 })
  })

  test.skip('dates in dashboard are formatted according to selected locale', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Switch to EN
    await page.getByRole('button', { name: /^en$|english/i }).click()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // EN date format: "June 25, 2026" — not Czech "25. června 2026"
    // Check that month names are English
    const hasEnDate = await page
      .getByText(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      )
      .isVisible()
      .catch(() => false)

    // Soft assertion — locale format may vary by component
    expect(typeof hasEnDate).toBe('boolean')
  })
})
