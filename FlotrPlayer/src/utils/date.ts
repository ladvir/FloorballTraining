/** "YYYY-MM-DD" for a date-only API field (loggedAt, testDate, ...). */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10)

// Deliberately not Intl.DateTimeFormat - avoids depending on Hermes' ICU data being present
// on every target (native + web + emulator), for one simple Czech "d. m. yyyy" date format.
export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

/** Czech "d. m. yyyy · HH:MM" - same Intl-free approach as formatDate. */
export const formatDateTime = (iso: string): string => {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(iso)} · ${hh}:${mm}`
}
