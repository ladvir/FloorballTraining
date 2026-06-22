import { request } from '@playwright/test'

/**
 * Runs once before all E2E tests.
 *
 * The .NET API seeds test accounts at startup (Program.cs):
 *   - admin@flotr.cz  / Admin123!   (Identity role: Admin)
 *   - e2e.user@flotr.cz / E2eTest123! (Identity role: User, Development only)
 *
 * This setup only verifies that the API is reachable through the Vite proxy.
 * If the API is not running, tests will fail here with a clear error message.
 */
async function globalSetup() {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' })

  // GET /auth/me returns 401 when unauthenticated — confirms the API is up.
  const res = await ctx.get('/api/auth/me')
  if (res.status() !== 401) {
    const body = await res.text()
    throw new Error(
      `API health check failed — expected 401 from GET /api/auth/me, got ${res.status()}.\n` +
        `Response: ${body}\n\n` +
        `Make sure the .NET API is running: dotnet run --project FloorballTraining.API`
    )
  }

  await ctx.dispose()
}

export default globalSetup
