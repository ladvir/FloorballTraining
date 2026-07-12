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

export function AppointmentsHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={open} onClose={onClose} title={t('appointments.helpTitle')} maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          {t('appointments.helpIntroPre')} <strong>{t('appointments.helpIntroPage')}</strong>{' '}
          {t('appointments.helpIntroBody')}
        </p>

        <Section title={t('appointments.helpHeaderTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('appointments.helpHeaderViewLabel')}</strong>{' '}
              {t('appointments.helpHeaderViewPre')}{' '}
              <Tag color="sky">{t('appointments.listView')}</Tag>{' '}
              {t('appointments.helpHeaderViewListNote')}{' '}
              <Tag color="sky">{t('appointments.calendarView')}</Tag>{' '}
              {t('appointments.helpHeaderViewCalNote')}
            </li>
            <li>
              <Tag color="sky">{t('appointments.newEvent')}</Tag>{' '}
              {t('appointments.helpHeaderNewEventDesc')}
            </li>
            <li>
              <Tag color="sky">{t('appointments.exportWorkTime')}</Tag>{' '}
              {t('appointments.helpHeaderReportDesc')}
            </li>
            <li>
              <Tag color="sky">{t('appointments.importIcal')}</Tag>{' '}
              {t('appointments.helpHeaderImportDesc')}
            </li>
            <li>
              <Tag color="red">{t('appointments.deleteAll')}</Tag>{' '}
              {t('appointments.helpHeaderDeleteAllDescPre')}{' '}
              <em>{t('appointments.helpHeaderDeleteAllEm')}</em>{' '}
              {t('appointments.helpHeaderDeleteAllDescPost')}
            </li>
            <li>
              <Tag>{t('common.help')}</Tag> {t('appointments.helpHeaderHelpDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpFiltersTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('appointments.helpFiltersSeasonLabel')}</strong>{' '}
              {t('appointments.helpFiltersSeasonDescPre')}{' '}
              <em>{t('appointments.helpFiltersSeasonEm')}</em>{' '}
              {t('appointments.helpFiltersSeasonDescPost')}
            </li>
            <li>
              <strong>{t('appointments.helpFiltersTeamLabel')}</strong>{' '}
              {t('appointments.helpFiltersTeamDesc')}
            </li>
            <li className="text-xs text-gray-500">{t('appointments.helpFiltersNote')}</li>
          </ul>
        </Section>

        <Section title={t('appointments.helpTypesTitle')}>
          <p>{t('appointments.helpTypesIntro')}</p>
          <div className="flex flex-wrap gap-2">
            <Tag color="sky">{t('appointments.typeTraining')}</Tag>
            <Tag color="emerald">{t('appointments.typeCamp')}</Tag>
            <Tag color="amber">{t('appointments.typePromotion')}</Tag>
            <Tag color="red">{t('appointments.typeMatch')}</Tag>
            <Tag>{t('appointments.typeOther')}</Tag>
            <Tag color="sky">{t('appointments.typeWorkshop')}</Tag>
            <Tag color="emerald">{t('appointments.typeOrganizing')}</Tag>
          </div>
          <p className="text-xs text-gray-500">
            {t('appointments.helpTypesNotePre')} <strong>{t('appointments.typeTraining')}</strong>{' '}
            {t('appointments.helpTypesNoteMid1')} <em>{t('appointments.helpTypesNoteEm1')}</em>{' '}
            {t('appointments.helpTypesNoteMid2')} <strong>{t('appointments.typeMatch')}</strong>{' '}
            {t('appointments.helpTypesNoteMid3')} <em>{t('appointments.helpTypesNoteEm2')}</em>.
          </p>
        </Section>

        <Section title={t('appointments.helpListTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('appointments.helpListItem1Pre')}{' '}
              <strong>{t('appointments.helpListItem1Date')}</strong>,{' '}
              <strong>{t('appointments.helpListItem1Name')}</strong>{' '}
              {t('appointments.helpListItem1Mid')}{' '}
              <strong>{t('appointments.helpListItem1Type')}</strong>{' '}
              {t('appointments.helpListItem1Post')}
            </li>
            <li>{t('appointments.helpListItem2')}</li>
            <li>
              {t('appointments.helpListItem3Pre')}{' '}
              <strong>{t('appointments.helpListItem3Repeat')}</strong>{' '}
              {t('appointments.helpListItem3Post')}
            </li>
            <li>{t('appointments.helpListItem4')}</li>
          </ul>
        </Section>

        <Section title={t('appointments.helpCalTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('appointments.helpCalItem1Pre')} <Tag>{t('common.today')}</Tag>{' '}
              {t('appointments.helpCalItem1Post')}
            </li>
            <li>{t('appointments.helpCalItem2')}</li>
            <li>{t('appointments.helpCalItem3')}</li>
            <li>
              {t('appointments.helpCalItem4Pre')} <em>{t('appointments.helpCalItem4Em')}</em>.
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpDetailTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('appointments.helpDetailItem1Label')}</strong>{' '}
              {t('appointments.helpDetailItem1Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpDetailItem2Label')}</strong>{' '}
              {t('appointments.helpDetailItem2Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpDetailItem3Label')}</strong>{' '}
              {t('appointments.helpDetailItem3Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpDetailItem4Label')}</strong>{' '}
              {t('appointments.helpDetailItem4DescPre')}{' '}
              <Tag color="sky">{t('appointments.helpDetailItem4Tag1')}</Tag>{' '}
              {t('appointments.helpDetailItem4Or')}{' '}
              <Tag color="sky">{t('appointments.helpDetailItem4Tag2')}</Tag>.
            </li>
            <li>
              <strong>{t('appointments.helpDetailItem5Label')}</strong>{' '}
              {t('appointments.helpDetailItem5Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpDetailItem6Label')}</strong>{' '}
              {t('appointments.helpDetailItem6Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpFormTitle')}>
          <p>
            {t('appointments.helpFormIntroPre')} <Tag color="sky">{t('appointments.newEvent')}</Tag>{' '}
            {t('appointments.helpFormIntroPost')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('appointments.helpFormItem1Label')}</strong>{' '}
              {t('appointments.helpFormItem1Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpFormItem2Label')}</strong>{' '}
              {t('appointments.helpFormItem2Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpFormItem3Label')}</strong>{' '}
              {t('appointments.helpFormItem3Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpFormItem4Label')}</strong>{' '}
              {t('appointments.helpFormItem4Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpFormItem5Label')}</strong>{' '}
              {t('appointments.helpFormItem5DescPre')} <em>{t('appointments.helpFormItem5Em')}</em>{' '}
              {t('appointments.helpFormItem5DescPost')}
            </li>
            <li>
              <strong>{t('appointments.helpFormItem6Label')}</strong>{' '}
              {t('appointments.helpFormItem6Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpRecurTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('appointments.helpRecurItem1Pre')}{' '}
              <Tag color="sky">{t('appointments.helpRecurToggle')}</Tag>{' '}
              {t('appointments.helpRecurItem1Mid')} <em>{t('appointments.helpRecurFreq1')}</em>,{' '}
              <em>{t('appointments.helpRecurFreq2')}</em>,{' '}
              <em>{t('appointments.helpRecurFreq3')}</em>,{' '}
              <em>{t('appointments.helpRecurFreq4')}</em> {t('appointments.helpRecurItem1Post')}
            </li>
            <li>
              {t('appointments.helpRecurItem2Pre')}{' '}
              <strong>{t('appointments.helpRecurItem2Label')}</strong>.{' '}
              {t('appointments.helpRecurItem2Post')}
            </li>
            <li>
              {t('appointments.helpRecurItem3Pre')} <em>{t('appointments.helpRecurItem3Em1')}</em>,{' '}
              {t('appointments.helpRecurItem3Or')} <em>{t('appointments.helpRecurItem3Em2')}</em>.
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpShareTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('appointments.helpShareItem1')}</li>
            <li>
              <strong>{t('appointments.helpShareItem2Label')}</strong>{' '}
              {t('appointments.helpShareItem2Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpShareItem3Label')}</strong>{' '}
              {t('appointments.helpShareItem3Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpShareItem4Label')}</strong>{' '}
              {t('appointments.helpShareItem4Desc')}
            </li>
            <li>
              <strong>{t('appointments.helpShareItem5Label')}</strong>{' '}
              {t('appointments.helpShareItem5Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('appointments.helpTipsTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('appointments.helpTipsItem1')}</li>
            <li>
              {t('appointments.helpTipsItem2Pre')}{' '}
              <strong>{t('appointments.helpTipsItem2Label')}</strong>{' '}
              {t('appointments.helpTipsItem2Post')}
            </li>
            <li>
              {t('appointments.helpTipsItem3Pre')}{' '}
              <Tag color="sky">{t('appointments.importIcal')}</Tag>.
            </li>
            <li>
              {t('appointments.helpTipsItem4Pre')}{' '}
              <Tag color="sky">{t('appointments.exportWorkTime')}</Tag>{' '}
              {t('appointments.helpTipsItem4Post')}
            </li>
            <li>{t('appointments.helpTipsItem5')}</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
