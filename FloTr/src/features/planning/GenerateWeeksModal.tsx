import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { planningApi } from '../../api/planning.api'
import { toast } from '../../utils/toast'
import { dfLocale } from '../../utils/dateLocale'
import { cn } from '../../utils/cn'
import type { MesocycleDto } from '../../types/domain.types'
import { generateWeeksPreview, typeBlockClass, daySpan } from './planningUtils'

const TYPES = [0, 1, 2, 3, 4]

interface GenerateWeeksModalProps {
  isOpen: boolean
  onClose: () => void
  mesocycle: MesocycleDto
}

/**
 * Splits a mesocycle into Monday-aligned week microcycles. Shows a client-side
 * preview; when the mesocycle already has microcycles, asks before overwriting.
 */
export function GenerateWeeksModal({ isOpen, onClose, mesocycle }: GenerateWeeksModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [type, setType] = useState(0)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const hasExisting = mesocycle.microcycles.length > 0
  const namePrefix = t('planning.weekNamePrefix')

  const preview = useMemo(
    () => generateWeeksPreview(mesocycle.startDate, mesocycle.endDate, namePrefix),
    [mesocycle.startDate, mesocycle.endDate, namePrefix]
  )

  const mutation = useMutation({
    mutationFn: (overwrite: boolean) =>
      planningApi.generateWeeks(mesocycle.id, { type, namePrefix, overwrite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasonPlan'] })
      queryClient.invalidateQueries({ queryKey: ['planCalendar'] })
      toast.success(t('planning.weeksGenerated', { count: preview.length }))
      setConfirmOverwrite(false)
      onClose()
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setConfirmOverwrite(true)
        return
      }
      toast.error(t('planning.saveFailed'))
    },
  })

  const fmt = (iso: string) => format(parseISO(iso), 'd.M.', { locale: dfLocale() })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('planning.generateWeeks')} maxWidth="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {t('planning.generateWeeksHint', { name: mesocycle.name, count: preview.length })}
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('planning.defaultWeekType')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t(`planning.type${tp}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">{t('planning.preview')}</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {preview.map((week) => (
              <li
                key={week.startDate}
                className={cn(
                  'flex items-center justify-between rounded border px-2 py-1 text-xs',
                  typeBlockClass(type)
                )}
              >
                <span className="font-medium">{week.name}</span>
                <span>
                  {fmt(week.startDate)} – {fmt(week.endDate)} (
                  {t('planning.days', { count: daySpan(week.startDate, week.endDate) })})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {hasExisting && !confirmOverwrite && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('planning.overwriteWarning', { count: mesocycle.microcycles.length })}</span>
          </div>
        )}
        {confirmOverwrite && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('planning.overwriteConfirm')}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {confirmOverwrite ? (
            <Button
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate(true)}
            >
              {t('planning.overwriteAndGenerate')}
            </Button>
          ) : (
            <Button loading={mutation.isPending} onClick={() => mutation.mutate(false)}>
              {t('planning.generate')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
