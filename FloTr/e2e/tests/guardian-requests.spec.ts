import { test, expect, type Page } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Parent self-service guardian linking (#113): a coach issues an invite code for a
 * child, a parent files a request against it on a public page (creating a login),
 * and a coach approves it from the dashboard, creating the MemberGuardian link.
 */

async function openFirstMemberDetail(page: Page): Promise<boolean> {
  await page.goto('/members')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 })

  const row = page
    .locator('table tbody tr')
    .filter({ hasNot: page.locator('th') })
    .first()
  if ((await row.count()) === 0) return false
  await row.click()
  await page.waitForURL(/\/members\/\d+/, { timeout: 5_000 })
  await page.waitForLoadState('networkidle')
  return true
}

// Force Czech regardless of the browser's default locale — the UI text assertions
// below (and loginViaUi itself) are Czech-only, like the rest of this suite.
async function forceCzech(page: Page): Promise<void> {
  await clearAuthState(page)
  await page.evaluate(() => localStorage.setItem('flotr_lang', 'cs'))
}

test.describe('Guardian self-service link requests', () => {
  test('coach can generate and copy a guardian invite code', async ({ page }) => {
    await forceCzech(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    if (!(await openFirstMemberDetail(page))) {
      test.skip()
      return
    }

    await expect(page.getByText(/rodiče \/ opatrovníci/i).first()).toBeVisible({ timeout: 5_000 })

    const generateBtn = page.getByRole('button', { name: /vygenerovat kód/i })
    if (await generateBtn.isVisible().catch(() => false)) {
      await generateBtn.click()
    }

    // Either way, a code should now be shown in a <code> element.
    await expect(page.locator('code').first()).toBeVisible({ timeout: 5_000 })
  })

  test('full flow: generate code, parent self-request, coach approves', async ({ page }) => {
    await forceCzech(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)

    if (!(await openFirstMemberDetail(page))) {
      test.skip()
      return
    }

    await expect(page.getByText(/rodiče \/ opatrovníci/i).first()).toBeVisible({ timeout: 5_000 })

    // Revoke any existing code first so we get a deterministic fresh one, then generate.
    const revokeBtn = page.getByTitle(/zrušit kód/i)
    if (await revokeBtn.isVisible().catch(() => false)) {
      await revokeBtn.scrollIntoViewIfNeeded()
      await revokeBtn.click()
      await page.getByRole('button', { name: 'Potvrdit', exact: true }).click()
      await expect(page.getByRole('button', { name: /vygenerovat kód/i })).toBeVisible({
        timeout: 5_000,
      })
    }
    const generateBtn = page.getByRole('button', { name: /vygenerovat kód/i })
    await generateBtn.scrollIntoViewIfNeeded()
    await generateBtn.click()
    await expect(page.locator('code').first()).toBeVisible({ timeout: 5_000 })
    const code = await page.locator('code').first().innerText()
    expect(code.length).toBeGreaterThan(10)

    // Parent self-request on the public page.
    await forceCzech(page)
    await page.goto('/guardian/link-request')
    const email = `e2e-guardian-${Date.now()}@test.example`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/kód od trenéra/i).fill(code)
    await page.getByRole('button', { name: /odeslat žádost/i }).click()
    await expect(page.getByText(/žádost byla odeslána/i)).toBeVisible({ timeout: 10_000 })

    // Coach approves from the dashboard widget.
    await forceCzech(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/žádosti rodičů/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(email).first()).toBeVisible()

    // The innermost div that both mentions this request's e-mail and contains its own
    // Schválit button is the request's Card — scoping to it avoids clicking a sibling card's button.
    const requestCard = page
      .locator('div')
      .filter({ hasText: email })
      .filter({ has: page.getByRole('button', { name: 'Schválit', exact: true }) })
      .last()
    await requestCard.getByRole('button', { name: 'Schválit', exact: true }).click()
    await expect(page.getByText(email).first()).not.toBeVisible({ timeout: 10_000 })
  })

  test('invalid code is rejected on the public page', async ({ page }) => {
    await forceCzech(page)
    await page.goto('/guardian/link-request')
    await page.getByLabel(/email/i).fill(`e2e-invalid-${Date.now()}@test.example`)
    await page.getByLabel(/kód od trenéra/i).fill('this-code-does-not-exist')
    await page.getByRole('button', { name: /odeslat žádost/i }).click()
    await expect(page.getByText(/neplatný kód/i)).toBeVisible({ timeout: 10_000 })
  })
})
