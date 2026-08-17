import { useTranslation } from 'react-i18next'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

type FlagProps = { className?: string }

/** Czech flag (white / red with blue hoist triangle). */
function FlagCz({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 6 4" className={className} aria-hidden="true">
      <rect width="6" height="4" fill="#fff" />
      <rect y="2" width="6" height="2" fill="#d7141a" />
      <path d="M0 0 3 2 0 4 Z" fill="#11457e" />
    </svg>
  )
}

/** United Kingdom flag (Union Jack). */
function FlagGb({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <clipPath id="ls-gb-clip">
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <g clipPath="url(#ls-gb-clip)">
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  )
}

/** Slovak flag (white / blue / red tricolour with simplified shield). */
function FlagSk({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} aria-hidden="true">
      <rect width="9" height="2" fill="#fff" />
      <rect y="2" width="9" height="2" fill="#0b4ea2" />
      <rect y="4" width="9" height="2" fill="#ee1c25" />
      {/* Simplified coat of arms */}
      <path
        d="M1.2 1.3h2.4v2.1c0 1.1-1.2 1.6-1.2 1.6S1.2 4.5 1.2 3.4Z"
        fill="#fff"
        stroke="#ee1c25"
        strokeWidth="0.2"
      />
      <path
        d="M2.4 1.9v2.4M1.7 2.6h1.4M1.9 3.2h1"
        stroke="#ee1c25"
        strokeWidth="0.35"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Polish flag (white / red). */
function FlagPl({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 8 5" className={className} aria-hidden="true">
      <rect width="8" height="2.5" fill="#fff" />
      <rect y="2.5" width="8" height="2.5" fill="#dc143c" />
    </svg>
  )
}

/** German flag (black / red / gold tricolour). */
function FlagDe({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 5 3" className={className} aria-hidden="true">
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#d00" />
      <rect y="2" width="5" height="1" fill="#ffce00" />
    </svg>
  )
}

const LANGS = [
  { code: 'cs', Flag: FlagCz, labelKey: 'auth.languageCs' },
  { code: 'sk', Flag: FlagSk, labelKey: 'auth.languageSk' },
  { code: 'pl', Flag: FlagPl, labelKey: 'auth.languagePl' },
  { code: 'de', Flag: FlagDe, labelKey: 'auth.languageDe' },
  { code: 'en', Flag: FlagGb, labelKey: 'auth.languageEn' },
] as const

interface LanguageSwitcherProps {
  /** "light" for use on dark backgrounds (landing page), "default" on white. */
  variant?: 'default' | 'light'
}

/**
 * Language toggle with flags. Changes the UI language immediately (persisted to
 * localStorage by the i18next detector) and, for signed-in users, saves the choice to
 * their profile so it is restored on the next login from any device.
 */
export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUser = useAuthStore((s) => s.setUser)
  const active = i18n.language ?? 'cs'
  const current = LANGS.find((l) => active.startsWith(l.code))?.code ?? 'cs'

  const change = async (code: string) => {
    if (code === current) return
    await i18n.changeLanguage(code)
    if (isAuthenticated) {
      // Persist per-user; ignore failures (the local change already took effect).
      try {
        const updated = await authApi.setLanguage(code)
        setUser(updated)
      } catch {
        /* offline or transient — local + localStorage choice still applies */
      }
    }
  }

  const wrap = variant === 'light' ? 'border-white/20 bg-white/5' : 'border-gray-200'
  const activeCls = variant === 'light' ? 'bg-white/20' : 'bg-sky-100'
  const idleCls = 'opacity-50 hover:opacity-90'

  return (
    <div className={`flex items-center overflow-hidden rounded-lg border ${wrap}`}>
      {LANGS.map(({ code, Flag, labelKey }) => (
        <button
          key={code}
          onClick={() => change(code)}
          className={`px-1.5 py-1 transition ${current === code ? activeCls : idleCls}`}
          aria-label={t(labelKey)}
          aria-pressed={current === code}
          title={t(labelKey)}
        >
          <Flag className="h-3.5 w-5 rounded-[1px]" />
        </button>
      ))}
    </div>
  )
}
