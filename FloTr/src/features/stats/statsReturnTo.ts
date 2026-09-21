/** Appends the page to return to once stat entry is done, as a `from` query param — read back
 * via `useSearchParams().get('from')` on the setup/live pages. Lets "Zavřít" go to wherever the
 * coach actually came from instead of always popping one browser-history entry. */
export function withReturnTo(path: string, fromPath: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}from=${encodeURIComponent(fromPath)}`
}
