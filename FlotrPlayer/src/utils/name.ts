// Name display convention across the app (user request): surname in UPPERCASE, given name with
// only its first letter capitalised — "Jan Novák" → "NOVÁK Jan". Mirrors LeaderboardService.FormatName
// on the server, so leaderboard rows (formatted server-side) and every client-rendered name match.

/** Given name as "Jan" — first letter upper, rest lower. */
export function formatGivenName(firstName: string): string {
  const s = (firstName ?? '').trim()
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : ''
}

/** Surname as "NOVÁK" — uppercase (accents preserved). */
export function formatSurname(lastName: string): string {
  return (lastName ?? '').trim().toUpperCase()
}

/** Full name shown wherever a person is listed: "PŘÍJMENÍ Jméno". */
export function formatFullName(firstName: string, lastName: string): string {
  return `${formatSurname(lastName)} ${formatGivenName(firstName)}`.trim()
}
