import { test, expect, type Page } from '@playwright/test'
import { USERS } from '../fixtures/users'
import { loginViaUi, clearAuthState } from '../helpers/auth'

/**
 * Member ↔ login-account linking — "Feat - link user with member" (#60).
 *
 * From the member side you can create a login, link/unlink an existing user and
 * set the account language; from the admin users side you can set member data
 * (birth year, gender) and the preferred language. Tests are lenient about seed
 * data: they accept either state (linked / roster-only) and never require a
 * destructive mutation.
 */

test.describe('User ↔ member linking', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await loginViaUi(page, USERS.admin.email, USERS.admin.password)
  })

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

  test('member detail shows an account status badge', async ({ page }) => {
    if (!(await openFirstMemberDetail(page))) {
      test.skip()
      return
    }
    // Either "Propojeno" (linked) or "Bez účtu" (roster-only).
    const linked = page.getByText(/propojeno/i).first()
    const noLogin = page.getByText(/bez účtu/i).first()
    const hasBadge =
      (await linked.isVisible().catch(() => false)) ||
      (await noLogin.isVisible().catch(() => false))
    expect(hasBadge).toBeTruthy()
  })

  test('info tab exposes the account section with link actions', async ({ page }) => {
    if (!(await openFirstMemberDetail(page))) {
      test.skip()
      return
    }
    await expect(page.getByText(/přihlašovací účet/i).first()).toBeVisible({ timeout: 5_000 })

    // Roster-only members show create/link buttons; linked members show unlink.
    const create = page.getByRole('button', { name: /založit přihlášení/i })
    const link = page.getByRole('button', { name: /propojit uživatele/i })
    const unlink = page.getByRole('button', { name: /odpojit účet/i })
    const anyAction =
      (await create.isVisible().catch(() => false)) ||
      (await link.isVisible().catch(() => false)) ||
      (await unlink.isVisible().catch(() => false))
    expect(anyAction).toBeTruthy()
  })

  test('member edit form has a gender selector', async ({ page }) => {
    if (!(await openFirstMemberDetail(page))) {
      test.skip()
      return
    }
    await page
      .getByRole('button', { name: /upravit/i })
      .first()
      .click()
    // Modal opens on the members page with the form.
    await expect(page.getByText(/pohlaví/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('admin new-user modal offers language, birth year and gender', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await page
      .getByRole('button', { name: /nový uživatel|new user/i })
      .first()
      .click()

    await expect(page.getByText(/jazyk/i).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/ročník/i).first()).toBeVisible()
    await expect(page.getByText(/pohlaví/i).first()).toBeVisible()
  })

  test('admin edit-user modal lets the preferred language be changed', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const editBtn = page.getByRole('button', { name: /upravit|edit/i }).first()
    if ((await editBtn.count()) === 0) {
      test.skip()
      return
    }
    await editBtn.click()

    const langSelect = page
      .locator('select')
      .filter({ hasText: /čeština|english/i })
      .first()
    await expect(langSelect).toBeVisible({ timeout: 5_000 })
    await langSelect.selectOption('en')
    await expect(page.getByRole('main')).toBeVisible()
  })
})
