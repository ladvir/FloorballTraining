import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from '../../utils/toast'
import { trainingTemplatesApi } from '../../api/trainingTemplates.api'
import { buildTemplateParts, type SourcePart } from './trainingTemplateUtils'

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultName: string
  parts: SourcePart[]
}

function Body({ onClose, defaultName, parts }: Omit<Props, 'isOpen'>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(defaultName)
  const [selected, setSelected] = useState<number[]>(parts.map((_, i) => i))
  const [includeActivities, setIncludeActivities] = useState(true)

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  const save = useMutation({
    mutationFn: () =>
      trainingTemplatesApi.create({
        name: name.trim(),
        parts: buildTemplateParts(parts, selected, includeActivities),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-templates'] })
      toast.success(t('trainingTemplates.saved'))
      onClose()
    },
    onError: () => toast.error(t('trainingTemplates.saveFailed')),
  })

  const lastIndex = parts.length - 1
  return (
    <div className="space-y-4">
      <Input
        label={t('trainingTemplates.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t('trainingTemplates.partsToInclude')}
          </span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setSelected(parts.map((_, i) => i))}
            >
              {t('trainingTemplates.selectAll')}
            </button>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setSelected(lastIndex > 0 ? [0, lastIndex] : [0])}
            >
              {t('trainingTemplates.selectFirstLast')}
            </button>
          </div>
        </div>
        <div className="space-y-1 rounded-lg border border-gray-200 p-2">
          {parts.map((p, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
              <span className="flex-1">{p.name || '—'}</span>
              <span className="text-xs text-gray-500">{p.duration} min</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeActivities}
          onChange={(e) => setIncludeActivities(e.target.checked)}
        />
        {t('trainingTemplates.includeActivities')}
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          disabled={!name.trim() || selected.length === 0}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export function SaveAsTemplateModal({ isOpen, ...rest }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={rest.onClose} title={t('trainingTemplates.saveAs')}>
      {/* Body mounts only while open, so its state resets for each use. */}
      {isOpen && <Body {...rest} />}
    </Modal>
  )
}
