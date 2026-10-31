import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { trainingTemplatesApi } from '../../api/trainingTemplates.api'
import type { TrainingTemplateDto } from '../../types/domain.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Called with the chosen template and (when `withPosition`) where to put its parts. */
  onPick: (template: TrainingTemplateDto, position: 'start' | 'end') => void
  /** Show the start/end choice (inserting into a training that is already being edited). */
  withPosition?: boolean
  title: string
}

function Body({ onClose, onPick, withPosition }: Omit<Props, 'isOpen' | 'title'>) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [position, setPosition] = useState<'start' | 'end'>('start')
  const { data: templates, isLoading } = useQuery({
    queryKey: ['training-templates'],
    queryFn: trainingTemplatesApi.getAll,
  })
  const selected = templates?.find((x) => x.id === selectedId)

  if (isLoading) return <LoadingSpinner />
  if (!templates?.length)
    return <p className="text-sm text-gray-500">{t('trainingTemplates.pickerEmpty')}</p>

  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setSelectedId(tpl.id)}
            className={`w-full rounded-lg border p-3 text-left ${
              tpl.id === selectedId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
            <div className="text-xs text-gray-500">
              {t('trainingTemplates.summary', {
                parts: tpl.parts.length,
                minutes: tpl.totalDuration,
              })}
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {tpl.parts.map((p) => `${p.name || '—'} (${p.duration})`).join(' · ')}
            </div>
          </button>
        ))}
      </div>

      {withPosition && (
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">{t('trainingTemplates.position')}</span>
          {(['start', 'end'] as const).map((p) => (
            <label key={p} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="template-position"
                checked={position === p}
                onChange={() => setPosition(p)}
              />
              {t(p === 'start' ? 'trainingTemplates.atStart' : 'trainingTemplates.atEnd')}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button disabled={!selected} onClick={() => selected && onPick(selected, position)}>
          {t('trainingTemplates.use')}
        </Button>
      </div>
    </div>
  )
}

export function TemplatePickerModal({ isOpen, title, ...rest }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={rest.onClose} title={title} maxWidth="lg">
      {isOpen && <Body {...rest} />}
    </Modal>
  )
}
