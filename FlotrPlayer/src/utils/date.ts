// Deliberately not Intl.DateTimeFormat - avoids depending on Hermes' ICU data being present
// on every target (native + web + emulator), for one simple Czech "d. m. yyyy" date format.
export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}
