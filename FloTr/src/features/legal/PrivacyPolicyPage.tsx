import { useTranslation } from 'react-i18next'
import { Bullets, CONTACT_EMAIL, LegalPage, Section, TextWithEmailLink } from './LegalPage'

/** Public, unauthenticated page (Google Play requires a stable privacy-policy URL, both in the
 * Play Console listing and linked from inside the Flotr – Player app). */
export function PrivacyPolicyPage() {
  const { t } = useTranslation()

  const items = (key: string) => t(key, { returnObjects: true }) as string[]

  return (
    <LegalPage title={t('privacy.title')} lastUpdated={t('privacy.lastUpdated')}>
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
          <TextWithEmailLink text={t('privacy.section13Body', { email: CONTACT_EMAIL })} />
        </p>
      </Section>
    </LegalPage>
  )
}
