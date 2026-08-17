import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

test.describe('Training videos (#129)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await page.evaluate(() => localStorage.setItem('flotr_lang', 'cs'))
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('videos section works in the training form and shows read-only in the detail modal', async ({
    page,
  }) => {
    // Training creation doesn't navigate to edit mode (unlike activities) — save, then
    // reopen the training from the list to reach the edit route where Videos lives.
    const name = `E2E training video test ${Date.now()}`
    await page.goto('/trainings/new')
    await page.getByLabel('Název tréninku').fill(name)
    await page.getByRole('button', { name: 'Uložit trénink' }).click()
    await expect(page.getByText('Trénink uložen.')).toBeVisible({ timeout: 10_000 })

    await page.goto('/trainings')
    await page.getByPlaceholder('Hledat (název, popis, autor, aktivita)…').fill(name)
    await expect(page.getByText(name)).toBeVisible()
    await page.getByRole('button', { name: 'Upravit' }).first().click()
    await page.waitForURL(/\/trainings\/\d+\/edit/, { timeout: 10_000 })

    const videosSection = page.getByTestId('videos-section')
    await expect(videosSection).toBeVisible()

    await videosSection.getByRole('button', { name: 'Vložit odkaz' }).click()
    await videosSection
      .getByLabel('URL adresa videa')
      .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await videosSection.getByRole('button', { name: 'Přidat' }).click()

    const youtubeFrame = videosSection.locator(
      'iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]'
    )
    await expect(youtubeFrame).toBeVisible({ timeout: 10_000 })

    // Read-only detail modal shows the same video without add/delete controls.
    await page.goto('/trainings')
    await page.getByPlaceholder('Hledat (název, popis, autor, aktivita)…').fill(name)
    await expect(page.getByText(name)).toBeVisible()
    await page.getByRole('button', { name: 'Detail' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')
    ).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByTitle('Smazat')).toHaveCount(0)

    // Clean up via the form's delete control.
    await page.goto('/trainings')
    await page.getByPlaceholder('Hledat (název, popis, autor, aktivita)…').fill(name)
    await expect(page.getByText(name)).toBeVisible()
    await page.getByRole('button', { name: 'Upravit' }).first().click()
    await page.waitForURL(/\/trainings\/\d+\/edit/, { timeout: 10_000 })
    await videosSection.getByTitle('Smazat').click()
    await expect(videosSection.getByText('Zatím žádná videa')).toBeVisible()
  })
})
