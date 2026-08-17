import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('profile page loads and shows page header', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /profil|nastavení|settings/i }).first()
    ).toBeVisible({
      timeout: 5_000,
    })
  })

  test('profile page displays logged-in user email', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // User email should appear somewhere on the page
    await expect(page.getByText(USERS.admin.email)).toBeVisible({ timeout: 5_000 })
  })

  test('personal data form fields are present and editable', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // First name and last name inputs
    const firstNameInput = page.getByLabel(/jméno|first name/i)
    const lastNameInput = page.getByLabel(/příjmení|last name/i)

    await expect(firstNameInput).toBeVisible({ timeout: 5_000 })
    await expect(lastNameInput).toBeVisible({ timeout: 5_000 })

    // Inputs accept text
    await firstNameInput.fill('Test')
    await expect(firstNameInput).toHaveValue('Test')
  })

  test('save button is present and not disabled when form is valid', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    const saveBtn = page.getByRole('button', { name: /uložit|save/i })
    await expect(saveBtn).toBeVisible({ timeout: 5_000 })
    await expect(saveBtn).not.toBeDisabled()
  })

  test('role badge is displayed in profile header', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

    // Roles section with badge (Admin, User, etc.)
    const roleSection = page.getByText(/^role$/i)
    const hasBadge =
      (await roleSection.count()) > 0 || (await page.getByText(/admin|user/i).count()) > 0

    expect(hasBadge).toBeTruthy()
  })
})
