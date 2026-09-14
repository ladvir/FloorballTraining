import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher'

const CONTACT_EMAIL = 'support@flotr.cz'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** Public, unauthenticated page (Google Play requires a stable privacy-policy URL, both in the
 * Play Console listing and linked from inside the Flotr – Player app). */
export function PrivacyPolicyPage() {
  const { t } = useTranslation()

  const items = (key: string) => t(key, { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-[#0EA5E9]">
            {t('landing.title')}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/" className="text-sm text-sky-600 hover:underline">
          &larr; {t('privacy.backLink')}
        </Link>

        <h1 className="mb-1 mt-4 text-3xl font-bold text-gray-900">{t('privacy.title')}</h1>
        <p className="mb-8 text-sm text-gray-400">{t('privacy.lastUpdated')}</p>

        <p className="mb-4 text-sm leading-relaxed text-gray-600">{t('privacy.intro1')}</p>
        <p className="mb-8 text-sm leading-relaxed text-gray-600">{t('privacy.intro2')}</p>

        <Section title={t('privacy.section1Title')}>
          <p>{t('privacy.section1Body')}</p>
        </Section>

        <Section title={t('privacy.section2Title')}>
          <Bullets items={items('privacy.section2Items')} />
        </Section>

        <Section title={t('privacy.section3Title')}>
          <Bullets items={items('privacy.section3Items')} />
        </Section>

        <Section title={t('privacy.section4Title')}>
          <Bullets items={items('privacy.section4Items')} />
        </Section>

        <Section title={t('privacy.section5Title')}>
          <Bullets items={items('privacy.section5Items')} />
        </Section>

        <Section title={t('privacy.section6Title')}>
          <p>{t('privacy.section6Body')}</p>
        </Section>

        <Section title={t('privacy.section7Title')}>
          <Bullets items={items('privacy.section7Items')} />
        </Section>

        <Section title={t('privacy.section8Title')}>
          <p>{t('privacy.section8Body')}</p>
        </Section>

        <Section title={t('privacy.section9Title')}>
          <p>{t('privacy.section9Intro')}</p>
          <Bullets items={items('privacy.section9Items')} />
        </Section>

        <Section title={t('privacy.section10Title')}>
          <p>{t('privacy.section10Body')}</p>
        </Section>

        <Section title={t('privacy.section11Title')}>
          <p>{t('privacy.section11Body')}</p>
        </Section>

        <Section title={t('privacy.section12Title')}>
          <p>{t('privacy.section12Body')}</p>
        </Section>

        <Section title={t('privacy.section13Title')}>
          <p>
            {t('privacy.section13Body', { email: CONTACT_EMAIL })
              .split(CONTACT_EMAIL)
              .flatMap((part, i, arr) =>
                i < arr.length - 1
                  ? [
                      part,
                      <a
                        key={i}
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-sky-600 hover:underline"
                      >
                        {CONTACT_EMAIL}
                      </a>,
                    ]
                  : [part]
              )}
          </p>
        </Section>
      </div>

      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">
          © {t('landing.title')}. {t('landing.subtitle')}
        </div>
      </footer>
    </div>
  )
}
