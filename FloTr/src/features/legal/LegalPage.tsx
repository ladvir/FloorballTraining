import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher'

export const CONTACT_EMAIL = 'support@flotr.cz'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  )
}

export function Bullets({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`ml-4 space-y-1.5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  )
}

/** Renders `text` with every occurrence of the contact e-mail turned into a mailto link. */
export function TextWithEmailLink({ text }: { text: string }) {
  return (
    <>
      {text.split(CONTACT_EMAIL).flatMap((part, i, arr) =>
        i < arr.length - 1
          ? [
              part,
              <a key={i} href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>,
            ]
          : [part]
      )}
    </>
  )
}

/** Shared chrome for public, unauthenticated legal pages (privacy policy, account deletion). */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()

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

        <h1 className="mb-1 mt-4 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mb-8 text-sm text-gray-400">{lastUpdated}</p>

        {children}
      </div>

      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center text-sm text-slate-500">
          <span>
            © {t('landing.title')}. {t('landing.subtitle')}
          </span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-700 hover:underline">
              {t('privacy.title')}
            </Link>
            <Link to="/delete-account" className="hover:text-slate-700 hover:underline">
              {t('deleteAccountPage.title')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
