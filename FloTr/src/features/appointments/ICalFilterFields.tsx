import { useTranslation } from 'react-i18next'
import { Input } from '../../components/ui/Input'
import { ICAL_TYPE_OPTIONS } from './useICalImportFilters'

export function ICalFilterFields({
  from,
  to,
  types,
  onFromChange,
  onToChange,
  onToggleType,
}: {
  from: string
  to: string
  types: number[]
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onToggleType: (value: number) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label={t('common.from')}
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
        />
        <Input
          type="date"
          label={t('common.to')}
          value={to}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('appointments.icalFilterTypesLabel')}
        </label>
        <div className="flex flex-wrap gap-3">
          {ICAL_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={types.includes(opt.value)}
                onChange={() => onToggleType(opt.value)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {types.length === 0 ? t('appointments.icalFilterAllTypes') : null}
        </p>
      </div>
    </>
  )
}
