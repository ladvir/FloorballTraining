import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher'

/* ── Icons ──────────────────────────────────────────────────────────────── */

function IconTraining({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="2" x2="17" y2="16" stroke="currentColor" strokeWidth="2" />
      <path d="M17 16 L21 18 Q22 20 20 21 L14 19 Q13 18 14 17 Z" fill="currentColor" />
      <ellipse cx="8" cy="21.5" rx="4" ry="1.5" fill="currentColor" fillOpacity="0.6" />
    </svg>
  )
}

function IconTactical({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="18"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <circle cx="6.5" cy="9" r="2" fill="currentColor" />
      <circle cx="17.5" cy="13" r="2" fill="currentColor" />
      <path d="M8 10 Q12 6 16 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
      <polyline
        points="14.5,11 16,12.5 14.5,13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

function IconStats({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" fillOpacity="0.5" />
      <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" fillOpacity="0.75" />
      <rect x="17" y="10" width="4" height="11" rx="1" fill="currentColor" />
      <polyline points="5,12 12,6 21,8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="4" r="2" fill="currentColor" />
      <circle cx="21" cy="4" r="3.5" fill="currentColor" fillOpacity="0.25" />
    </svg>
  )
}

function IconStopwatch({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9.5" y="2" width="5" height="2.5" rx="1.25" fill="currentColor" />
      <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="1.75" />
      <line x1="12" y1="14" x2="12" y2="9" stroke="currentColor" strokeWidth="2" />
      <line
        x1="12"
        y1="14"
        x2="15"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />
      <circle cx="12" cy="14" r="1.25" fill="currentColor" />
    </svg>
  )
}

function IconMembers({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="8" r="3" fill="currentColor" fillOpacity="0.35" />
      <path
        d="M2 21 Q2 15 8.5 15 Q11 15 13 16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        fillOpacity="0.5"
      />
      <circle cx="15" cy="7" r="3.5" fill="currentColor" />
      <path d="M7 21 Q8 15 15 15 Q22 15 22 21" fill="currentColor" />
    </svg>
  )
}

function IconTrophy({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6 Q4 6 4 10 Q4 14 8 13" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path
        d="M16 6 Q20 6 20 10 Q20 14 16 13"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
      />
      <path d="M8 4 L16 4 L15.5 13 Q15 17 12 17 Q9 17 8.5 13 Z" fill="currentColor" />
      <line x1="12" y1="17" x2="12" y2="20" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="20" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}

function IconFeedback({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hlavní bublina */}
      <path
        d="M3 6 Q3 3 6 3 L18 3 Q21 3 21 6 L21 14 Q21 17 18 17 L13 17 L9 21 L9 17 L6 17 Q3 17 3 14 Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Hvězdičky — hodnocení */}
      <path
        d="M8 10 L8.6 8.2 L9.2 10 L11 10 L9.6 11.1 L10.2 12.9 L8.6 11.8 L7 12.9 L7.6 11.1 L6.2 10 Z"
        fill="currentColor"
      />
      <path
        d="M12.5 10 L13.1 8.2 L13.7 10 L15.5 10 L14.1 11.1 L14.7 12.9 L13.1 11.8 L11.5 12.9 L12.1 11.1 L10.7 10 Z"
        fill="currentColor"
      />
      <path
        d="M17 10 L17.6 8.2 L18.2 10 L20 10 L18.6 11.1 L19.2 12.9 L17.6 11.8 L16 12.9 L16.6 11.1 L15.2 10 Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  )
}

/* ── Screenshot component ────────────────────────────────────────────────── */

function AppScreenshot({
  src,
  alt,
  gradient,
  fallbackIcon,
  className = '',
}: {
  src: string
  alt: string
  gradient: string
  fallbackIcon: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/8 ${className}`}
    >
      {/* Gradient fallback — vždy zobrazeno jako podklad, překryto screenshotem po načtení */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <div className="rounded-2xl bg-white/15 p-6 text-white backdrop-blur-sm">
          {fallbackIcon}
        </div>
      </div>
      <img
        src={src}
        alt={alt}
        className="relative z-10 h-auto w-full opacity-0 transition-opacity duration-500"
        onLoad={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onError={(e) => {
          e.currentTarget.remove()
        }}
      />
    </div>
  )
}

/* ── Data ────────────────────────────────────────────────────────────────── */

const featureMeta = [
  {
    Icon: IconTraining,
    gradient: 'from-sky-500 to-blue-600',
    accent: 'sky',
    image: '/screenshots/trainings.png',
    flip: false,
    prefix: 'featurePreparation' as const,
    bulletCount: 3,
  },
  {
    Icon: IconTactical,
    gradient: 'from-violet-500 to-purple-600',
    accent: 'violet',
    image: '/screenshots/tactical.png',
    flip: true,
    prefix: 'featureTactical' as const,
    bulletCount: 2,
  },
  {
    Icon: IconStats,
    gradient: 'from-emerald-500 to-green-600',
    accent: 'emerald',
    image: '/screenshots/stats.png',
    flip: false,
    prefix: 'featureStats' as const,
    bulletCount: 1,
  },
  {
    Icon: IconStopwatch,
    gradient: 'from-orange-500 to-amber-600',
    accent: 'orange',
    image: '/screenshots/physical-tests.png',
    flip: true,
    prefix: 'featureTesting' as const,
    bulletCount: 3,
  },
  {
    Icon: IconMembers,
    gradient: 'from-pink-500 to-rose-600',
    accent: 'pink',
    image: '/screenshots/members.png',
    flip: false,
    prefix: 'featureMembers' as const,
    bulletCount: 2,
  },
  {
    Icon: IconTrophy,
    gradient: 'from-cyan-500 to-sky-600',
    accent: 'cyan',
    image: '/screenshots/appointments.png',
    flip: true,
    prefix: 'featureCalendar' as const,
    bulletCount: 2,
  },
  {
    Icon: IconFeedback,
    gradient: 'from-indigo-500 to-violet-600',
    accent: 'indigo',
    image: '/screenshots/feedback.png',
    flip: false,
    prefix: 'featureFeedback' as const,
    bulletCount: 3,
  },
]

const accentClasses: Record<string, { tag: string; check: string; blob: string }> = {
  sky: { tag: 'bg-sky-50 text-sky-600', check: 'from-sky-500 to-blue-600', blob: 'bg-sky-400' },
  violet: {
    tag: 'bg-violet-50 text-violet-600',
    check: 'from-violet-500 to-purple-600',
    blob: 'bg-violet-400',
  },
  emerald: {
    tag: 'bg-emerald-50 text-emerald-600',
    check: 'from-emerald-500 to-green-600',
    blob: 'bg-emerald-400',
  },
  orange: {
    tag: 'bg-orange-50 text-orange-600',
    check: 'from-orange-500 to-amber-600',
    blob: 'bg-orange-400',
  },
  pink: {
    tag: 'bg-pink-50 text-pink-600',
    check: 'from-pink-500 to-rose-600',
    blob: 'bg-pink-400',
  },
  cyan: { tag: 'bg-cyan-50 text-cyan-600', check: 'from-cyan-500 to-sky-600', blob: 'bg-cyan-400' },
  indigo: {
    tag: 'bg-indigo-50 text-indigo-600',
    check: 'from-indigo-500 to-violet-600',
    blob: 'bg-indigo-400',
  },
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const { t } = useTranslation()

  const features = featureMeta.map(
    ({ Icon, gradient, accent, image, flip, prefix, bulletCount }) => ({
      Icon,
      gradient,
      accent,
      image,
      flip,
      tag: t(`landing.${prefix}Tag`),
      title: t(`landing.${prefix}Title`),
      desc: t(`landing.${prefix}Desc`),
      bullets: Array.from({ length: bulletCount }, (_, i) => t(`landing.${prefix}Bullet${i + 1}`)),
      imageAlt: t(`landing.${prefix}ImageAlt`),
    })
  )

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans antialiased">
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {t('landing.title')}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <Link to="/login">
              <Button variant="primary" size="sm">
                {t('landing.login')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-150 pt-16">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-sky-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-0 text-center sm:px-6 sm:pt-32 mb-32">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="text-sky-400">Flo</span>
            {t('landing.heroWord1Rest')} <span className="text-sky-400">Tr</span>
            {t('landing.heroWord2Rest')}
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-slate-400 sm:text-xl">
            {t('landing.heroSubtitle')}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login">
              <Button size="lg" variant="primary">
                {t('landing.login')}
              </Button>
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-sky-400 px-6 text-base font-medium text-sky-400 transition-colors hover:border-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {t('landing.features')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Feature sections ─────────────────────────────────────────── */}
      <section id="features">
        {features.map(
          ({ Icon, tag, title, desc, bullets, gradient, accent, image, imageAlt, flip }, i) => {
            const ac = accentClasses[accent]
            return (
              <div
                key={title}
                className={`relative overflow-hidden border-b border-gray-100 py-20 sm:py-28 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                {/* Colored blur blob — na straně textu */}
                <div
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-[450px] w-[550px] rounded-full opacity-[0.12] blur-[100px] ${ac.blob} ${flip ? 'right-[-100px]' : 'left-[-100px]'}`}
                />
                <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
                  <div
                    className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-20 ${flip ? 'lg:flex-row-reverse' : ''}`}
                  >
                    {/* Text — mřížka pouze zde */}
                    <div className="relative w-full overflow-hidden rounded-2xl p-8 lg:w-5/12 lg:flex-shrink-0">
                      {/* Grid pattern jen za textem */}
                      <div
                        className="absolute inset-0 opacity-[0.08]"
                        style={{
                          backgroundImage: `linear-gradient(rgba(100,116,139,1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(100,116,139,1) 1px, transparent 1px)`,
                          backgroundSize: '48px 48px',
                        }}
                      />
                      <div className="relative">
                        <span
                          className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ac.tag}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tag}
                        </span>
                        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                          {title}
                        </h2>
                        <p className="mb-7 text-lg leading-relaxed text-gray-500">{desc}</p>
                        <ul className="space-y-3">
                          {bullets.map((b) => (
                            <li key={b} className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}
                              >
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                              <span className="text-sm leading-relaxed text-gray-600">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>{' '}
                      {/* /relative content */}
                    </div>

                    {/* Screenshot */}
                    <div className="w-full lg:w-7/12">
                      <AppScreenshot
                        src={image}
                        alt={imageAlt}
                        gradient={gradient}
                        fallbackIcon={<Icon className="h-12 w-12 text-white" />}
                        className="min-h-[260px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-28 sm:px-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(14,165,233,0.3) 0%, transparent 55%),
                              radial-gradient(circle at 70% 50%, rgba(99,102,241,0.2) 0%, transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mb-10 text-lg text-slate-400">{t('landing.ctaSubtitle')}</p>
          <Link to="/login">
            <Button size="lg" variant="primary">
              {t('landing.login')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <span className="font-semibold text-slate-400">{t('landing.title')}</span>
          <span>
            © {t('landing.title')}. {t('landing.subtitle')}
          </span>
        </div>
      </footer>
    </div>
  )
}
