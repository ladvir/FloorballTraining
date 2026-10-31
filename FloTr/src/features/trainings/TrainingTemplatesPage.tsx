import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { toast } from '../../utils/toast'
import { activitiesApi } from '../../api/activities.api'
import { trainingTemplatesApi } from '../../api/trainingTemplates.api'
import type { TrainingTemplateDto, TrainingTemplatePartDto } from '../../types/domain.types'

const emptyPart = (order: number): TrainingTemplatePartDto => ({
  name: '',
  description: '',
  duration: 10,
  order,
  activityIds: [],
})

function TemplateEditor({
  template,
  onClose,
}: {
  template: TrainingTemplateDto | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [parts, setParts] = useState<TrainingTemplatePartDto[]>(
    template?.parts.length ? template.parts.map((p) => ({ ...p })) : [emptyPart(1)]
  )
  const { data: activities } = useQuery({ queryKey: ['activities'], queryFn: activitiesApi.getAll })
  const activityName = (id: number) => activities?.find((a) => a.id === id)?.name ?? `#${id}`

  const patchPart = (i: number, patch: Partial<TrainingTemplatePartDto>) =>
    setParts((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        description,
        parts: parts.map((p, i) => ({ ...p, order: i + 1 })),
      }
      return template
        ? trainingTemplatesApi.update(template.id, body)
        : trainingTemplatesApi.create(body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-templates'] })
      onClose()
    },
    onError: () => toast.error(t('trainingTemplates.saveFailed')),
  })

  const valid = name.trim().length > 0 && parts.length > 0 && parts.every((p) => p.duration >= 0)

  return (
    <div className="space-y-4">
      <Input
        label={t('trainingTemplates.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label={t('trainingTemplates.description')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="space-y-3">
        {parts.map((part, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t('trainingTemplates.partName')}
                  value={part.name ?? ''}
                  onChange={(e) => patchPart(i, { name: e.target.value })}
                />
              </div>
              <div className="w-24">
                <Input
                  label={t('trainingTemplates.partDuration')}
                  type="number"
                  min={0}
                  value={part.duration}
                  onChange={(e) => patchPart(i, { duration: Number(e.target.value) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t('trainingTemplates.removePart')}
                onClick={() => setParts((ps) => ps.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {part.activityIds.map((aid) => (
                <span
                  key={aid}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {activityName(aid)}
                  <button
                    type="button"
                    aria-label={t('trainingTemplates.removeActivity')}
                    onClick={() =>
                      patchPart(i, { activityIds: part.activityIds.filter((x) => x !== aid) })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <select
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                value=""
                onChange={(e) => {
                  const id = Number(e.target.value)
                  if (id && !part.activityIds.includes(id))
                    patchPart(i, { activityIds: [...part.activityIds, id] })
                }}
              >
                <option value="">{t('trainingTemplates.addActivity')}</option>
                {(activities ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setParts((ps) => [...ps, emptyPart(ps.length + 1)])}
        >
          <Plus className="h-4 w-4" />
          {t('trainingTemplates.addPart')}
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export function TrainingTemplatesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<TrainingTemplateDto | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainingTemplateDto | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['training-templates'],
    queryFn: trainingTemplatesApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-templates'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error(t('trainingTemplates.deleteFailed')),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title={t('trainingTemplates.title')}
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            {t('trainingTemplates.new')}
          </Button>
        }
      />

      {!templates?.length ? (
        <EmptyState
          title={t('trainingTemplates.emptyTitle')}
          description={t('trainingTemplates.emptyDesc')}
        />
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900">{tpl.name}</div>
                <div className="text-xs text-gray-500">
                  {t('trainingTemplates.summary', {
                    parts: tpl.parts.length,
                    minutes: tpl.totalDuration,
                  })}
                  {tpl.createdByUserName ? ` · ${tpl.createdByUserName}` : ''}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {tpl.parts.map((p) => `${p.name || '—'} (${p.duration})`).join(' · ')}
                </div>
              </div>
              {tpl.canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('common.edit')}
                    onClick={() => setEditing(tpl)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('common.delete')}
                    onClick={() => setDeleteTarget(tpl)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('trainingTemplates.new') : t('trainingTemplates.edit')}
        maxWidth="2xl"
      >
        {editing !== null && (
          <TemplateEditor
            template={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('trainingTemplates.deleteTitle')}
      >
        <p className="mb-4 text-sm text-gray-600">
          {t('trainingTemplates.deleteConfirm', { name: deleteTarget?.name })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
