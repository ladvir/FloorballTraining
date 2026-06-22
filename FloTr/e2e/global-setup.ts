import { request } from '@playwright/test'
import { USERS } from './fixtures/users'

/**
 * Runs once before all E2E tests.
 * Seeds the plain-User account used by authorization tests.
 * Admin (admin@flotr.cz) is seeded by Program.cs at API startup.
 */
async function globalSetup() {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' })

  const res = await ctx.post('/api/auth/register', {
    data: {
      email: USERS.user.email,
      password: USERS.user.password,
      firstName: USERS.user.firstName,
      lastName: USERS.user.lastName,
    },
  })

  // 200 = created, 400 = already exists (both are fine for idempotent seeding)
  if (!res.ok() && res.status() !== 400) {
    const body = await res.text()
    throw new Error(`E2E seed failed (${res.status()}): ${body}`)
  }

  await ctx.dispose()
}

export default globalSetup
