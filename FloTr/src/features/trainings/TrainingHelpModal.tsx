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

export function TrainingHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={open} onClose={onClose} title={t('trainings.helpTitle')} maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          {t('trainings.helpIntroPre')} <strong>{t('trainings.helpIntroParts')}</strong>{' '}
          {t('trainings.helpIntroMid')}
          <strong> {t('trainings.helpIntroActivities')}</strong> {t('trainings.helpIntroMid2')}{' '}
          <strong>{t('trainings.helpIntroGoal')}</strong> {t('trainings.helpIntroEnd')}
        </p>

        <Section title={t('trainings.helpHeaderTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('trainings.helpHeaderBackLabel')}</strong>{' '}
              {t('trainings.helpHeaderBackDesc')}
            </li>
            <li>
              <Tag color="sky">{t('trainings.schedule')}</Tag>{' '}
              {t('trainings.helpHeaderScheduleDesc')}
            </li>
            <li>
              <Tag color="sky">{t('trainings.helpHeaderPdfLabel')}</Tag>{' '}
              {t('trainings.helpHeaderPdfDesc')}
            </li>
            <li>
              <Tag color="sky">{t('trainings.copyTraining')}</Tag>{' '}
              {t('trainings.helpHeaderCopyDesc')}
            </li>
            <li>
              {t('trainings.helpHeaderStatusPre')} <Tag color="green">{t('common.complete')}</Tag>{' '}
              {t('trainings.helpHeaderStatusOr')} <Tag color="amber">{t('common.draft')}</Tag>{' '}
              {t('trainings.helpHeaderStatusDesc')}
            </li>
            <li>
              <Tag>{t('common.help')}</Tag> {t('trainings.helpHeaderHelpDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpBasicTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('trainings.helpBasicNameLabel')}</strong>{' '}
              {t('trainings.helpBasicNameDescPre')} <Tag>{t('trainings.formSuggestName')}</Tag>{' '}
              {t('trainings.helpBasicNameDescPost')}
            </li>
            <li>
              <strong>{t('trainings.helpBasicDurationLabel')}</strong>{' '}
              {t('trainings.helpBasicDurationDesc')}
            </li>
            <li className="text-xs text-gray-500">
              {t('trainings.helpBasicAgeNotePre')} <em>{t('trainings.helpBasicAgeNoteEm')}</em>{' '}
              {t('trainings.helpBasicAgeNotePost')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpGoalsTitle')}>
          <p>
            {t('trainings.helpGoalsIntroPre')} <em>{t('trainings.helpGoalsIntroEx1')}</em>,{' '}
            <em>{t('trainings.helpGoalsIntroEx2')}</em>, <em>{t('trainings.helpGoalsIntroEx3')}</em>
            {t('trainings.helpGoalsIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('trainings.helpGoalsItem1Label')}</strong>{' '}
              {t('trainings.helpGoalsItem1DescPre')} <em>{t('trainings.helpGoalsItem1Em')}</em>.
            </li>
            <li>
              <Tag color="sky">{t('trainings.formAutoGoals')}</Tag>{' '}
              {t('trainings.helpGoalsItem2Desc')}
            </li>
            <li>
              <Tag color="sky">{t('trainings.formSuggestGoals')}</Tag>{' '}
              {t('trainings.helpGoalsItem3Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpPartsTitle')}>
          <p>
            {t('trainings.helpPartsIntroPre')}{' '}
            <strong>{t('trainings.helpPartsIntroPartsWord')}</strong>
            {t('trainings.helpPartsIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="sky">{t('trainings.formAddPart')}</Tag>{' '}
              {t('trainings.helpPartsItem1Desc')}
            </li>
            <li>
              <strong>{t('trainings.helpPartsItem2Label')}</strong>{' '}
              {t('trainings.helpPartsItem2Desc')}
            </li>
            <li>
              {t('trainings.helpPartsItem3Pre')}
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li>
                  <strong>{t('trainings.helpPartsSubItem3aLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem3aDesc')}
                </li>
                <li>
                  <strong>{t('trainings.helpPartsSubItem3bLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem3bDesc')}
                </li>
                <li>
                  <strong>{t('trainings.helpPartsSubItem3cLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem3cDesc')}
                </li>
              </ul>
            </li>
            <li>
              {t('trainings.helpPartsItem4Pre')}
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li>
                  <strong>{t('trainings.helpPartsSubItem4aLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem4aDesc')}
                </li>
                <li>
                  <strong>{t('trainings.helpPartsSubItem4bLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem4bDesc')}
                </li>
                <li>
                  <strong>{t('trainings.helpPartsSubItem4cLabel')}</strong>{' '}
                  {t('trainings.helpPartsSubItem4cDesc')}
                </li>
              </ul>
            </li>
            <li>
              <strong>{t('trainings.helpPartsItem5Label')}</strong>{' '}
              {t('trainings.helpPartsItem5Desc')}
            </li>
            <li>
              <Tag>×</Tag> {t('trainings.helpPartsItem6Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpSelectedTitle')}>
          <p>{t('trainings.helpSelectedDesc')}</p>
        </Section>

        <Section title={t('trainings.helpCoverageTitle')}>
          <p>{t('trainings.helpCoverageIntro')}</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('trainings.helpCoverageItem1Pre')}{' '}
              <strong>{t('trainings.helpCoverageItem1Label')}</strong>.
            </li>
            <li>
              <Tag color="green">{t('trainings.helpCoverageGreenLabel')}</Tag>{' '}
              {t('trainings.helpCoverageGreenDesc')},{' '}
              <Tag color="amber">{t('trainings.helpCoverageAmberLabel')}</Tag>{' '}
              {t('trainings.helpCoverageAmberDesc')}.
            </li>
            <li>
              {t('trainings.helpCoverageItem3Pre')}{' '}
              <strong>{t('trainings.helpCoverageItem3Label')}</strong>{' '}
              {t('trainings.helpCoverageItem3Post')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpImagesTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="sky">{t('trainings.helpImagesShowLabel')}</Tag> /{' '}
              <Tag>{t('trainings.helpImagesHideLabel')}</Tag> {t('trainings.helpImagesToggleDesc')}
            </li>
            <li>
              <Tag>{t('trainings.helpImagesShowAllLabel')}</Tag> /{' '}
              <Tag>{t('trainings.helpImagesShowDefaultLabel')}</Tag>{' '}
              {t('trainings.helpImagesAllDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpValidateTitle')}>
          <p>
            {t('trainings.helpValidateIntroPre')} <Tag color="green">{t('common.complete')}</Tag>
            {t('trainings.helpValidateIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1 text-gray-600">
            {(t('trainings.helpValidateItems', { returnObjects: true }) as string[]).map(
              (item, i) => (
                <li key={i}>{item}</li>
              )
            )}
          </ul>
        </Section>

        <Section title={t('trainings.helpDupTitle')}>
          <p>
            {t('trainings.helpDupIntroPre')} <strong>{t('trainings.helpDupIntroLabel')}</strong>
            {t('trainings.helpDupIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('trainings.helpDupItem1')}</li>
            <li>{t('trainings.helpDupItem2')}</li>
            <li>
              {t('trainings.helpDupItem3Pre')} <strong>{t('trainings.helpDupItem3Label')}</strong>{' '}
              {t('trainings.helpDupItem3Post')}
            </li>
          </ul>
        </Section>

        <Section title={t('trainings.helpShareTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('trainings.helpShareItem1Pre')}{' '}
              <strong>{t('trainings.helpShareItem1Label')}</strong>{' '}
              {t('trainings.helpShareItem1Post')}
            </li>
            <li>
              <Tag color="sky">{t('trainings.copyTraining')}</Tag>{' '}
              {t('trainings.helpShareItem2Desc')}
            </li>
            <li>{t('trainings.helpShareItem3')}</li>
          </ul>
        </Section>

        <Section title={t('trainings.helpTipsTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('trainings.helpTipsItem1')}</li>
            <li>
              {t('trainings.helpTipsItem2Pre')} <em>{t('trainings.helpTipsItem2Em')}</em>{' '}
              {t('trainings.helpTipsItem2Post')}
            </li>
            <li>
              {t('trainings.helpTipsItem3Pre')} <Tag>{t('trainings.formSuggestName')}</Tag>{' '}
              {t('trainings.helpTipsItem3Post')}
            </li>
            <li>
              {t('trainings.helpTipsItem4Pre')} <Tag color="sky">{t('trainings.copyTraining')}</Tag>{' '}
              {t('trainings.helpTipsItem4Post')}
            </li>
            <li>
              {t('trainings.helpTipsItem5Pre')} <strong>{t('trainings.helpTipsItem5Label')}</strong>{' '}
              {t('trainings.helpTipsItem5Post')}
            </li>
            <li>
              {t('trainings.helpTipsItem6Pre')} <Tag color="sky">{t('trainings.formSave')}</Tag>.{' '}
              {t('trainings.helpTipsItem6Post')}
            </li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
