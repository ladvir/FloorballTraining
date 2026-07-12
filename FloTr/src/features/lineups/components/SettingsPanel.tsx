import type { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../../components/ui/Card'
import type {
  AppointmentDto,
  FormationTemplateDto,
  MatchLineupDto,
} from '../../../types/domain.types'
import { format, parseISO } from 'date-fns'
import type { LineupAction } from '../lineupActions'

interface Props {
  lineup: MatchLineupDto
  templates: FormationTemplateDto[]
  appointments: AppointmentDto[]
  teamName?: string
  onChange: Dispatch<LineupAction>
  restrictToOneFormation: boolean
  onChangeRestrictToOneFormation: (value: boolean) => void
}

export function SettingsPanel({
  lineup,
  templates,
  appointments,
  teamName,
  onChange,
  restrictToOneFormation,
  onChangeRestrictToOneFormation,
}: Props) {
  const { t } = useTranslation()
  const template = templates.find((tpl) => tpl.id === lineup.formationTemplateId)

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('lineups.team')}
          </p>
          <p className="mt-0.5 text-sm font-medium text-gray-900">{teamName ?? '?'}</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('lineups.templateLabel')}
          </label>
          <select
            value={lineup.formationTemplateId}
            onChange={(e) => {
              const id = Number(e.target.value)
              const tpl = templates.find((x) => x.id === id)
              if (!tpl) return
              const slots = tpl.slots
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((s) => s.position)
              onChange({ type: 'setTemplate', templateId: id, slots })
            }}
            className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          {template && (
            <p className="mt-1 text-xs text-gray-500">
              {template.formationSize}
              {template.includesGoalie ? ' + 1' : ''} {t('lineups.playersOnField')}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('lineups.formationCount')}
          </label>
          <div className="mt-1 grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ type: 'setFormationCount', count: n })}
                className={`h-9 rounded-lg border text-sm font-medium transition-colors ${
                  lineup.formationCount === n
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('lineups.bindToMatch')}
          </label>
          <select
            value={lineup.appointmentId ?? ''}
            onChange={(e) =>
              onChange({
                type: 'setAppointmentId',
                id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">{t('lineups.noMatch')}</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? t('lineups.matchFallback')} ({format(parseISO(a.start), 'd.M.yyyy')})
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={restrictToOneFormation}
            onChange={(e) => onChangeRestrictToOneFormation(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
          />
          <span>
            <span className="font-medium text-gray-700">{t('lineups.onePlayerOneFormation')}</span>
            <span className="block text-xs text-gray-500">
              {t('lineups.onePlayerOneFormationDesc')}
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={lineup.isShared}
            onChange={(e) => onChange({ type: 'setIsShared', value: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
          />
          <span>
            <span className="font-medium text-gray-700">{t('lineups.shareWithPlayers')}</span>
            <span className="block text-xs text-gray-500">{t('lineups.shareWithPlayersDesc')}</span>
          </span>
        </label>
      </CardContent>
    </Card>
  )
}
