import { useTranslation } from 'react-i18next'
import { Modal } from '../../../components/shared/Modal'

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
  color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald'
}) {
  const palette = {
    gray: 'bg-gray-100 text-gray-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}
    >
      {children}
    </span>
  )
}

export function LineupHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={open} onClose={onClose} title={t('lineups.helpTitle')} maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          {t('lineups.helpIntroPre')} <strong>{t('lineups.helpPanelSettings')}</strong>,{' '}
          <strong>{t('lineups.helpPanelRoster')}</strong> {t('lineups.helpIntroAnd')}{' '}
          <strong>{t('lineups.helpPanelField')}</strong>.
        </p>

        <Section title={t('lineups.helpHeaderTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('lineups.helpHeaderNameLabel')}</strong>
              {t('lineups.helpHeaderNameDesc')}
            </li>
            <li>
              <Tag color="sky">{t('common.save')}</Tag> {t('lineups.helpHeaderSaveDesc')}
            </li>
            <li>
              <Tag>{t('common.help')}</Tag> {t('lineups.helpHeaderHelpDesc')}
            </li>
          </ul>
        </Section>

        <Section title={t('lineups.helpSettingsTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('lineups.helpSettingsTeamLabel')}</strong>
              {t('lineups.helpSettingsTeamDesc')}
            </li>
            <li>
              <strong>{t('lineups.helpSettingsTemplateLabel')}</strong>
              {t('lineups.helpSettingsTemplateDesc')}
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                {(t('lineups.helpSettingsTemplateList', { returnObjects: true }) as string[]).map(
                  (item, i) => (
                    <li key={i}>{item}</li>
                  )
                )}
              </ul>
              <p className="mt-1 text-xs text-gray-500">
                {t('lineups.helpSettingsTemplateNotePre')}{' '}
                <em>{t('lineups.helpSettingsTemplateNoteEm')}</em>{' '}
                {t('lineups.helpSettingsTemplateNotePost')}
              </p>
            </li>
            <li>
              <strong>{t('lineups.helpSettingsCountLabel')}</strong>
              {t('lineups.helpSettingsCountDesc')}
            </li>
            <li>
              <strong>{t('lineups.helpSettingsBindLabel')}</strong>
              {t('lineups.helpSettingsBindDesc')}
            </li>
            <li>
              <strong>{t('lineups.helpSettingsShareLabel')}</strong>
              {t('lineups.helpSettingsShareDescPre')}{' '}
              <em>{t('lineups.helpSettingsShareReadOnly')}</em>
              {t('lineups.helpSettingsShareDescPost')}
            </li>
          </ul>
        </Section>

        <Section title={t('lineups.helpRosterTitle')}>
          <p>{t('lineups.helpRosterIntro')}</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('lineups.helpRosterSquadLabel')}</strong>
              {t('lineups.helpRosterSquadDesc')}
            </li>
            <li>
              <Tag color="sky">{t('lineups.fromClub')}</Tag> {t('lineups.helpRosterFromClubDesc')}
            </li>
            <li>
              <Tag color="sky">{t('lineups.extraPlayer')}</Tag> {t('lineups.helpRosterExtraDesc')}
            </li>
            <li>
              {t('lineups.helpRosterPerPlayer')}
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li>
                  <strong>{t('lineups.helpRosterDragLabel')}</strong>
                  {t('lineups.helpRosterDragDesc')}
                </li>
                <li>
                  <strong>{t('lineups.helpRosterDotsLabel')}</strong>{' '}
                  {t('lineups.helpRosterDotsDesc')}
                </li>
                <li>
                  <strong>{t('lineups.helpRosterEyeLabel')}</strong>
                  {t('lineups.helpRosterEyeDesc')}
                </li>
                <li>
                  <strong>{t('lineups.helpRosterRemoveLabel')}</strong>
                  {t('lineups.helpRosterRemoveDesc')}
                </li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title={t('lineups.helpFieldTitle')}>
          <p>
            {t('lineups.helpFieldIntroPre')} <strong>{t('lineups.helpFieldIntroChips')}</strong>{' '}
            {t('lineups.helpFieldIntroCont')}
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="emerald">{t('lineups.formField')}</Tag> {t('lineups.helpFieldView1Desc')}
            </li>
            <li>
              <Tag color="emerald">{t('lineups.fieldsSideBySide')}</Tag>{' '}
              {t('lineups.helpFieldView2Desc')}
            </li>
            <li>
              <Tag color="emerald">{t('lineups.byPositions')}</Tag>{' '}
              {t('lineups.helpFieldView3Desc')}
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            {t('lineups.helpFieldPosNote')} <strong>B</strong> {t('lineups.helpFieldPosBDesc')}{' '}
            <strong>1</strong> {t('lineups.helpFieldPos1Desc')} <strong>2</strong>{' '}
            {t('lineups.helpFieldPos2Desc')} <strong>3</strong> {t('lineups.helpFieldPos3Desc')}
            <strong> 4</strong> {t('lineups.helpFieldPos4Desc')} <strong>5</strong>{' '}
            {t('lineups.helpFieldPos5Desc')}
          </p>
        </Section>

        <Section title={t('lineups.helpDndTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>{t('lineups.helpDndItem1Label')}</strong>
              {t('lineups.helpDndItem1Desc')}
            </li>
            <li>
              <strong>{t('lineups.helpDndItem2Label')}</strong>
              {t('lineups.helpDndItem2Desc')}
            </li>
            <li>
              <strong>{t('lineups.helpDndItem3Label')}</strong>
              {t('lineups.helpDndItem3Desc')}
            </li>
            <li>
              <strong>{t('lineups.helpDndItem4Label')}</strong>
              {t('lineups.helpDndItem4Desc')}
            </li>
            <li>
              {t('lineups.helpDndPillPre')} <strong>{t('lineups.helpDndPillLabel')}</strong>{' '}
              {t('lineups.helpDndPillDesc')}
            </li>
            <li>{t('lineups.helpDndKeyboard')}</li>
          </ul>
        </Section>

        <Section title={t('lineups.helpColorsTitle')}>
          <p>{t('lineups.helpColorsPre')} </p>
          <div className="flex flex-wrap gap-2">
            <Tag color="sky">{t('lineups.helpColor1')}</Tag>
            <Tag color="emerald">{t('lineups.helpColor2')}</Tag>
            <Tag color="amber">{t('lineups.helpColor3')}</Tag>
            <Tag color="violet">{t('lineups.helpColor4')}</Tag>
            <span className="inline-flex items-center rounded bg-pink-100 px-1.5 py-0.5 text-[11px] font-semibold text-pink-700">
              {t('lineups.helpColor5')}
            </span>
          </div>
          <p>{t('lineups.helpColorsDesc')}</p>
        </Section>

        <Section title={t('lineups.helpShareTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('lineups.helpShareItem1Pre')} <strong>{t('lineups.helpShareItem1Label')}</strong>{' '}
              {t('lineups.helpShareItem1Desc')}
            </li>
            <li>
              {t('lineups.helpShareItem2Pre')} <strong>{t('lineups.helpShareItem2Label')}</strong>
              {t('lineups.helpShareItem2Desc')}
            </li>
            <li>
              {t('lineups.helpShareItem3Pre')} <strong>{t('lineups.helpShareItem3Match')}</strong>{' '}
              {t('lineups.helpShareItem3Or')} <strong>{t('lineups.helpShareItem3Training')}</strong>{' '}
              {t('lineups.helpShareItem3Desc')}
            </li>
          </ul>
        </Section>

        <Section title={t('lineups.helpTipsTitle')}>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              {t('lineups.helpTipsItem1Pre')} <strong>{t('lineups.helpTipsItem1Label')}</strong>{' '}
              {t('lineups.helpTipsItem1Desc')}
            </li>
            <li>
              {t('lineups.helpTipsItem2Pre')} <strong>{t('lineups.helpTipsItem2Label')}</strong>{' '}
              {t('lineups.helpTipsItem2Desc')}
            </li>
            <li>
              {t('lineups.helpTipsItem3Pre')} <strong>{t('lineups.helpTipsItem3Label')}</strong>{' '}
              {t('lineups.helpTipsItem3Desc')}
            </li>
            <li>
              {t('lineups.helpTipsItem4Pre')} <strong>{t('lineups.helpTipsItem4Label')}</strong>
              {t('lineups.helpTipsItem4Desc')}
            </li>
            <li>
              {t('lineups.helpTipsItem5Pre')} <strong>{t('lineups.helpTipsItem5Label')}</strong>
              {t('lineups.helpTipsItem5Desc')}
            </li>
            <li>
              {t('lineups.helpTipsItem6Pre')} <strong>{t('lineups.helpTipsItem6Label')}</strong>
              {t('lineups.helpTipsItem6Desc')}
            </li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
