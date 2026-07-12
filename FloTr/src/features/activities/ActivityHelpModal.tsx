import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'

interface Props {
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2 text-sm text-gray-700">{children}</div>
    </section>
  )
}

function Tag({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald' | 'red' | 'green'
}) {
  const palette = {
    gray: 'bg-gray-100 text-gray-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}
    >
      {children}
    </span>
  )
}

export function ActivityHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={open} onClose={onClose} title={t('activities.helpTitle')} maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">{t('activities.helpIntro')}</p>

        <Section title={t('activities.helpHeaderTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('activities.helpHeaderBackLabel')}</strong>{' '}
              {t('activities.helpHeaderBackDesc')}
            </li>
            <li>
              <Tag color="sky">{t('activities.helpHeaderSelectLabel')}</Tag>{' '}
              {t('activities.helpHeaderSelectDesc')}
            </li>
            <li>
              <Tag color="sky">{t('activities.helpHeaderPdfLabel')}</Tag>{' '}
              {t('activities.helpHeaderPdfDesc')}
            </li>
            <li>
              {t('activities.helpHeaderStatusPre')} <Tag color="green">{t('common.complete')}</Tag>{' '}
              {t('activities.helpHeaderStatusOr')}{' '}
              <Tag color="amber">{t('activities.helpHeaderStatusDraftLabel')}</Tag>{' '}
              {t('activities.helpHeaderStatusDesc')}
            </li>
            <li>
              <Tag>{t('common.help')}</Tag> {t('activities.helpHeaderHelpDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('activities.helpBasicTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('activities.helpBasicNameLabel')}</strong>{' '}
              {t('activities.helpBasicNameDesc')}
            </li>
            <li>
              <strong>{t('activities.helpBasicDescLabel')}</strong>{' '}
              {t('activities.helpBasicDescDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('activities.helpDurationTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('activities.helpDurationRangeLabel')}</strong>{' '}
              {t('activities.helpDurationRangeDesc')}
            </li>
            <li>
              <strong>{t('activities.helpDurationPlayersLabel')}</strong>{' '}
              {t('activities.helpDurationPlayersDesc')}
            </li>
            <li className="text-xs text-gray-500">{t('activities.helpDurationNote')}</li>
          </ul>
        </Section>

        <Section title={t('activities.helpTagsTitle')}>
          <p>
            {t('activities.helpTagsIntroPre')} <em>{t('activities.helpTagsIntroEx1')}</em>,{' '}
            <em>{t('activities.helpTagsIntroEx2')}</em>, <em>{t('activities.helpTagsIntroEx3')}</em>
            ,<em>{t('activities.helpTagsIntroEx4')}</em>
            {t('activities.helpTagsIntroPost')}
          </p>
          <p className="text-xs text-gray-500">{t('activities.helpTagsNote')}</p>
        </Section>

        <Section title={t('activities.helpAgeTitle')}>
          <p>{t('activities.helpAgeIntro')}</p>
          <p className="text-xs text-gray-500">
            {t('activities.helpAgeNotePre')} <strong>{t('activities.helpAgeNoteLabel')}</strong>{' '}
            {t('activities.helpAgeNotePost')}
          </p>
        </Section>

        <Section title={t('activities.helpEquipTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('activities.helpEquipItem1')}</li>
            <li>
              <strong>{t('activities.helpEquipItem2Label')}</strong>{' '}
              {t('activities.helpEquipItem2DescPre')}{' '}
              <Tag color="sky">{t('activities.helpEquipItem2Tag')}</Tag>.{' '}
              {t('activities.helpEquipItem2DescPost')}
            </li>
          </ul>
        </Section>

        <Section title={t('activities.helpImagesTitle')}>
          <p>
            {t('activities.helpImagesIntroPre')}{' '}
            <strong>{t('activities.helpImagesIntroLabel')}</strong>{' '}
            {t('activities.helpImagesIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="sky">{t('common.upload')}</Tag> {t('activities.helpImagesUploadDesc')}
            </li>
            <li>
              <Tag color="sky">{t('activities.helpImagesDrawLabel')}</Tag>{' '}
              {t('activities.helpImagesDrawDesc')}
            </li>
            <li>
              {t('activities.helpImagesPerImagePre')}
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li>
                  <strong>{t('activities.helpImagesStarLabel')}</strong>{' '}
                  {t('activities.helpImagesStarDescPre')}{' '}
                  <em>{t('activities.helpImagesStarEm')}</em>.{' '}
                  {t('activities.helpImagesStarDescPost')}
                </li>
                <li>
                  <strong>{t('activities.helpImagesPencilLabel')}</strong>{' '}
                  {t('activities.helpImagesPencilDesc')}
                </li>
                <li>
                  <strong>{t('activities.helpImagesTrashLabel')}</strong>{' '}
                  {t('activities.helpImagesTrashDesc')}
                </li>
              </ul>
            </li>
            <li>{t('activities.helpImagesLightbox')}</li>
          </ul>
        </Section>

        <Section title={t('activities.helpValidateTitle')}>
          <p>
            {t('activities.helpValidateIntroPre')} <Tag color="green">{t('common.complete')}</Tag>
            {t('activities.helpValidateIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1 text-gray-600">
            {(t('activities.helpValidateItems', { returnObjects: true }) as string[]).map(
              (item, i) => (
                <li key={i}>{item}</li>
              )
            )}
          </ul>
          <p className="mt-1 text-xs text-gray-500">
            <Tag color="amber">{t('activities.helpValidateDraftLabel')}</Tag>{' '}
            {t('activities.helpValidateDraftDesc')}
          </p>
        </Section>

        <Section title={t('activities.helpShareTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('activities.helpShareItem1Pre')}{' '}
              <strong>{t('activities.helpShareItem1Label')}</strong>{' '}
              {t('activities.helpShareItem1Post')}
            </li>
            <li>{t('activities.helpShareItem2')}</li>
            <li>{t('activities.helpShareItem3')}</li>
          </ul>
        </Section>

        <Section title={t('activities.helpTipsTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('activities.helpTipsItem1Pre')}{' '}
              <Tag color="sky">{t('activities.helpTipsItem1Tag')}</Tag>.{' '}
              {t('activities.helpTipsItem1Post')}
            </li>
            <li>{t('activities.helpTipsItem2')}</li>
            <li>{t('activities.helpTipsItem3')}</li>
            <li>{t('activities.helpTipsItem4')}</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
