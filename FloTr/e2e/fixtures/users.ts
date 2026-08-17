/** Credentials for E2E test users. */
export const USERS = {
  /** System-wide Admin — Identity role "Admin", full access to all routes. */
  admin: {
    email: 'admin@flotr.cz',
    password: 'Admin123!',
    role: 'Admin' as const,
  },
  /** Plain User — no club role, no Identity admin role, limited access. */
  user: {
    email: 'e2e.user@flotr.cz',
    password: 'E2eTest123!',
    firstName: 'E2E',
    lastName: 'User',
    role: 'User' as const,
  },
  /**
   * Club-role users (HeadCoach, Coach, ClubAdmin) require Member records in the
   * database pointing to a club.  Seed them with a migration or fixture script
   * before running E2E tests in environments that need role-specific coverage.
   * The credentials below are reserved for future use.
   */
  headCoach: {
    email: 'e2e.headcoach@flotr.cz',
    password: 'E2eTest123!',
    role: 'HeadCoach' as const,
  },
  coach: {
    email: 'e2e.coach@flotr.cz',
    password: 'E2eTest123!',
    role: 'Coach' as const,
  },
  clubAdmin: {
    email: 'e2e.clubadmin@flotr.cz',
    password: 'E2eTest123!',
    role: 'ClubAdmin' as const,
  },
} as const
