// Name display convention across the whole app (user request): surname in UPPERCASE, given name
// with only its first letter capitalised — "Jan Novák" → "NOVÁK Jan". Mirrors the mobile app's
// utils/name.ts and LeaderboardService.FormatName on the server, so every rendered name matches.

/** Given name as "Jan" — first letter upper, rest lower. */
export function formatGivenName(firstName?: string | null): string {
  const s = (firstName ?? '').trim()
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : ''
}

/** Surname as "NOVÁK" — uppercase (accents preserved). */
export function formatSurname(lastName?: string | null): string {
  return (lastName ?? '').trim().toUpperCase()
}

/** Full name shown wherever a person is listed: "PŘÍJMENÍ Jméno". Empty when both parts are blank. */
export function formatFullName(firstName?: string | null, lastName?: string | null): string {
  return `${formatSurname(lastName)} ${formatGivenName(firstName)}`.trim()
}
