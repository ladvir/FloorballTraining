import { test, expect } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

// Minimal valid mp4: box-size header + "ftyp" at offset 4, which is all
// FileUploadValidator's magic-byte check inspects (see #127).
const FAKE_MP4 = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
])

test.describe('Activity videos (#128)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    // Force Czech regardless of the browser's default locale — the UI text
    // assertions below (and loginViaUi itself) are Czech-only, like the rest of this suite.
    await page.evaluate(() => localStorage.setItem('flotr_lang', 'cs'))
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

  test('add link, upload file, play and delete both', async ({ page }) => {
    // Create a fresh activity so the Videos section (edit-mode only) is available.
    await page.goto('/activities/new')
    await page.getByLabel('Název aktivity').fill(`E2E video test ${Date.now()}`)
    await page.getByLabel('Délka min. (min)').fill('5')
    await page.getByLabel('Délka max. (min)').fill('20')
    await page.getByLabel('Hráčů min.').fill('2')
    await page.getByLabel('Hráčů max.').fill('10')
    await page.getByRole('button', { name: 'Uložit aktivitu' }).click()
    await page.waitForURL(/\/activities\/\d+\/edit/, { timeout: 10_000 })

    const videosSection = page.getByTestId('videos-section')

    // ── Link (YouTube) ──────────────────────────────────────────────────
    await videosSection.getByRole('button', { name: 'Vložit odkaz' }).click()
    await videosSection
      .getByLabel('URL adresa videa')
      .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await videosSection.getByRole('button', { name: 'Přidat' }).click()

    const youtubeFrame = videosSection.locator(
      'iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]'
    )
    await expect(youtubeFrame).toBeVisible({ timeout: 10_000 })

    // ── Upload (file) ───────────────────────────────────────────────────
    await videosSection.locator('input[type="file"][accept="video/*"]').setInputFiles({
      name: 'sample.mp4',
      mimeType: 'video/mp4',
      buffer: FAKE_MP4,
    })

    const uploadedVideo = videosSection.locator('video[src*="/videos/activity/"]')
    await expect(uploadedVideo).toBeVisible({ timeout: 10_000 })

    // ── Delete both ─────────────────────────────────────────────────────
    for (let i = 0; i < 2; i++) {
      await videosSection.getByTitle('Smazat').first().click()
      await expect(videosSection.getByTitle('Smazat')).toHaveCount(1 - i)
    }
    await expect(videosSection.getByText('Zatím žádná videa')).toBeVisible()
  })
})
