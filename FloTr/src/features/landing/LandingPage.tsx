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
  fallbackIcon,
  className = '',
}: {
  src: string
  alt: string
  fallbackIcon: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Fallback — zobrazeno jako podklad, překryto screenshotem po načtení */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-600">
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
    image: '/screenshots/trainings.png',
    flip: false,
    prefix: 'featurePreparation' as const,
    bulletCount: 3,
  },
  {
    Icon: IconTactical,
    image: '/screenshots/tactical.png',
    flip: true,
    prefix: 'featureTactical' as const,
    bulletCount: 2,
  },
  {
    Icon: IconStats,
    image: '/screenshots/stats.png',
    flip: false,
    prefix: 'featureStats' as const,
    bulletCount: 1,
  },
  {
    Icon: IconStopwatch,
    image: '/screenshots/physical-tests.png',
    flip: true,
    prefix: 'featureTesting' as const,
    bulletCount: 3,
  },
  {
    Icon: IconMembers,
    image: '/screenshots/members.png',
    flip: false,
    prefix: 'featureMembers' as const,
    bulletCount: 2,
  },
  {
    Icon: IconTrophy,
    image: '/screenshots/appointments.png',
    flip: true,
    prefix: 'featureCalendar' as const,
    bulletCount: 2,
  },
  {
    Icon: IconFeedback,
    image: '/screenshots/feedback.png',
    flip: false,
    prefix: 'featureFeedback' as const,
    bulletCount: 3,
  },
]

/* ── Page ────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const { t } = useTranslation()

  const features = featureMeta.map(({ Icon, image, flip, prefix, bulletCount }) => ({
    Icon,
    image,
    flip,
    tag: t(`landing.${prefix}Tag`),
    title: t(`landing.${prefix}Title`),
    desc: t(`landing.${prefix}Desc`),
    bullets: Array.from({ length: bulletCount }, (_, i) => t(`landing.${prefix}Bullet${i + 1}`)),
    imageAlt: t(`landing.${prefix}ImageAlt`),
  }))

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans antialiased">
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xl font-bold tracking-tight text-[#0EA5E9]"
          >
            {t('landing.title')}
          </button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
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
        <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-0 text-center sm:px-6 sm:pt-32 mb-16">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="text-[#0EA5E9]">Flo</span>
            {t('landing.heroWord1Rest')} <span className="text-[#0EA5E9]">Tr</span>
            {t('landing.heroWord2Rest')}
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-slate-400 sm:text-xl">
            {t('landing.heroSubtitle')}
          </p>

          <div className="relative mx-auto mt-16 max-w-4xl sm:mt-20">
            <img src="/hero.png" alt={t('landing.heroImageAlt')} className="w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* ── Feature sections ─────────────────────────────────────────── */}
      <section id="features">
        {features.map(({ Icon, tag, title, desc, bullets, image, imageAlt, flip }, i) => {
          return (
            <div
              key={title}
              className={`border-b border-gray-100 py-20 sm:py-28 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
            >
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div
                  className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-20 ${flip ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Text */}
                  <div className="w-full p-8 lg:w-5/12 lg:flex-shrink-0">
                    <div>
                      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#0EA5E9]">
                        <Icon className="h-3.5 w-3.5" />
                        {tag}
                      </span>
                      <h2
                        className="mb-4 text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                      >
                        {title}
                      </h2>
                      <p className="mb-7 text-lg leading-relaxed text-gray-500">{desc}</p>
                      <ul className="space-y-3">
                        {bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0EA5E9]">
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
                      fallbackIcon={<Icon className="h-12 w-12 text-white" />}
                      className="min-h-[260px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-slate-50 px-4 py-28 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mb-10 text-lg text-gray-500">{t('landing.ctaSubtitle')}</p>
          <Link to="/login">
            <Button size="lg" variant="primary">
              {t('landing.login')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <span className="font-semibold text-slate-700">{t('landing.title')}</span>
          <span>
            © {t('landing.title')}. {t('landing.subtitle')}
          </span>
        </div>
      </footer>
    </div>
  )
}
