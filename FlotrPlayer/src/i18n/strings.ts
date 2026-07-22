// MVP ships Czech only (spec section 20 defers sk/en to a later stage). Routing every
// user-facing string through `t()` now means adding a locale later is additive - a new
// `Record<StringKey, string>` plus a way to pick `currentLocale` - not a rewrite of every screen.
export type StringKey =
  | 'auth.loginEmailPlaceholder'
  | 'auth.loginPasswordPlaceholder'
  | 'auth.loginSubmit'
  | 'auth.loginError'
  | 'auth.sessionExpired'
  | 'auth.logout'
  | 'home.greeting'

const cs: Record<StringKey, string> = {
  'auth.loginEmailPlaceholder': 'E-mail',
  'auth.loginPasswordPlaceholder': 'Heslo',
  'auth.loginSubmit': 'Přihlásit se',
  'auth.loginError': 'Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.',
  'auth.logout': 'Odhlásit se',
  'auth.sessionExpired': 'Vaše přihlášení vypršelo. Přihlaste se prosím znovu.',
  'home.greeting': 'Vítej, {name}!',
}

const locales = { cs }
const currentLocale: keyof typeof locales = 'cs'

export const t = (key: StringKey, params?: Record<string, string>): string => {
  const template = locales[currentLocale][key]
  if (!params) return template
  return Object.entries(params).reduce((str, [name, value]) => str.replace(`{${name}}`, value), template)
}
