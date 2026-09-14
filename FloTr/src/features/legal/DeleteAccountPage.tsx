import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bullets, CONTACT_EMAIL, LegalPage, Section, TextWithEmailLink } from './LegalPage'

/** Public, unauthenticated page — the "Delete account URL" Google Play requires on the Play
 * Console listing (Data safety section), separate from the in-app deletion flow it documents. */
export function DeleteAccountPage() {
  const { t } = useTranslation()

  const items = (key: string) => t(key, { returnObjects: true }) as string[]

  return (
    <LegalPage
      title={t('deleteAccountPage.title')}
      lastUpdated={t('deleteAccountPage.lastUpdated')}
    >
      <p className="mb-8 text-sm leading-relaxed text-gray-600">{t('deleteAccountPage.intro')}</p>

      <Section title={t('deleteAccountPage.stepsTitle')}>
        <Bullets ordered items={items('deleteAccountPage.steps')} />
      </Section>

      <Section title={t('deleteAccountPage.cantLoginTitle')}>
        <p>
          <TextWithEmailLink
            text={t('deleteAccountPage.cantLoginBody', { email: CONTACT_EMAIL })}
          />
        </p>
      </Section>

      <Section title={t('deleteAccountPage.deletedTitle')}>
        <Bullets items={items('deleteAccountPage.deletedItems')} />
      </Section>

      <Section title={t('deleteAccountPage.retainedTitle')}>
        <Bullets items={items('deleteAccountPage.retainedItems')} />
      </Section>

      <Section title={t('deleteAccountPage.timelineTitle')}>
        <p>{t('deleteAccountPage.timelineBody')}</p>
      </Section>

      <Section title={t('deleteAccountPage.moreInfoTitle')}>
        <p>
          {t('deleteAccountPage.moreInfoBody')}{' '}
          <Link to="/privacy" className="text-sky-600 hover:underline">
            {t('privacy.title')}
          </Link>
        </p>
      </Section>
    </LegalPage>
  )
}
