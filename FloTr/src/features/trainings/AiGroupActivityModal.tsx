import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, AlertTriangle, Clock, Users, Link as LinkIcon, RefreshCw } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, ageGroupsApi, equipmentApi, aiApi } from '../../api/index'
import type {
  ActivityDto,
  ActivitySuggestionDto,
  ActivitySuggestionsResultDto,
  ActivityTagDto,
  ActivityAgeGroupDto,
  ActivityEquipmentDto,
} from '../../types/domain.types'

interface AiGroupActivityModalProps {
  isOpen: boolean
  onClose: () => void
  clubId: number
  ageGroupNames: string[]
  goalNames: string[]
  durationMinutes?: number
  personsMin?: number
  personsMax?: number
  existingActivityNames: string[]
  onUse: (activity: ActivityDto) => void
}

function buildCriteria(
  t: (key: string, opts?: Record<string, unknown>) => string,
  props: Pick<
    AiGroupActivityModalProps,
    | 'ageGroupNames'
    | 'goalNames'
    | 'durationMinutes'
    | 'personsMin'
    | 'personsMax'
    | 'existingActivityNames'
  >
) {
  const parts = [
    t('ai.groupPicker.criteriaAgeGroups', {
      value: props.ageGroupNames.length
        ? props.ageGroupNames.join(', ')
        : t('ai.groupPicker.anyValue'),
    }),
    t('ai.groupPicker.criteriaGoals', {
      value: props.goalNames.length ? props.goalNames.join(', ') : t('ai.groupPicker.anyValue'),
    }),
  ]
  if (props.durationMinutes)
    parts.push(t('ai.groupPicker.criteriaDuration', { value: props.durationMinutes }))
  if (props.personsMin || props.personsMax)
    parts.push(
      t('ai.groupPicker.criteriaPersons', {
        min: props.personsMin ?? 1,
        max: props.personsMax ?? props.personsMin ?? 1,
      })
    )
  if (props.existingActivityNames.length)
    parts.push(
      t('ai.groupPicker.criteriaExclude', { value: props.existingActivityNames.join(', ') })
    )
  return parts.join(' ')
}

export function AiGroupActivityModal({
  isOpen,
  onClose,
  clubId,
  ageGroupNames,
  goalNames,
  durationMinutes,
  personsMin,
  personsMax,
  existingActivityNames,
  onUse,
}: AiGroupActivityModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [result, setResult] = useState<ActivitySuggestionsResultDto | null>(null)

  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
    enabled: isOpen,
  })
  const { data: allAgeGroups } = useQuery({
    queryKey: ['ageGroups'],
    queryFn: ageGroupsApi.getAll,
    enabled: isOpen,
  })
  const { data: allEquipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentApi.getAll,
    enabled: isOpen,
  })

  const searchMutation = useMutation({
    mutationFn: () =>
      aiApi.suggestActivities({
        clubId,
        criteria: buildCriteria(t, {
          ageGroupNames,
          goalNames,
          durationMinutes,
          personsMin,
          personsMax,
          existingActivityNames,
        }),
        count: 1,
        useWebSearch: true,
      }),
    onSuccess: setResult,
  })
  const errorCode =
    (searchMutation.error as { response?: { data?: { code?: string } } } | null)?.response?.data
      ?.code ?? 'unexpected'

  const useMutationHandler = useMutation({
    mutationFn: (suggestion: ActivitySuggestionDto) => {
      const tagDtos: ActivityTagDto[] = suggestion.tagIds.map((tagId) => ({
        id: 0,
        tagId,
        tag: allTags?.find((x) => x.id === tagId),
      }))
      const ageGroupDtos: ActivityAgeGroupDto[] = suggestion.ageGroupIds.map((agId) => ({
        id: 0,
        ageGroupId: agId,
        ageGroup: allAgeGroups?.find((ag) => ag.id === agId),
      }))
      const equipmentDtos: ActivityEquipmentDto[] = suggestion.equipmentIds.map((eqId) => ({
        id: 0,
        equipmentId: eqId,
        equipment: allEquipment?.find((e) => e.id === eqId),
      }))
      return activitiesApi.create({
        name: suggestion.name,
        description: suggestion.description,
        durationMin: suggestion.durationMin,
        durationMax: suggestion.durationMax,
        personsMin: suggestion.personsMin,
        personsMax: suggestion.personsMax,
        activityTags: tagDtos,
        activityAgeGroups: ageGroupDtos,
        activityEquipments: equipmentDtos,
      })
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      onUse(activity)
      setResult(null)
      onClose()
    },
  })

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('ai.groupPicker.title')} maxWidth="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{t('ai.groupPicker.subtitle')}</p>

        <Button
          onClick={() => searchMutation.mutate()}
          loading={searchMutation.isPending}
          disabled={clubId == null}
        >
          {result ? (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
          {result ? t('ai.groupPicker.searchAgain') : t('ai.groupPicker.search')}
        </Button>

        {searchMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t(`ai.generator.errors.${errorCode}`, {
              defaultValue: t('ai.generator.errors.unexpected'),
            })}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {result.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                {result.warnings.map((w, i) => (
                  <p key={i}>
                    {t(`ai.generator.warnings.${w.code}`, {
                      value: w.value ?? '',
                      defaultValue: w.code,
                    })}
                  </p>
                ))}
              </div>
            )}

            {result.suggestions.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">
                {t('ai.groupPicker.noResults')}
              </p>
            )}

            {result.suggestions.map((suggestion, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{suggestion.name}</h3>
                  <Button
                    size="sm"
                    onClick={() => useMutationHandler.mutate(suggestion)}
                    loading={useMutationHandler.isPending}
                  >
                    {t('ai.groupPicker.use')}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {suggestion.durationMin}–{suggestion.durationMax} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {suggestion.personsMin}–{suggestion.personsMax}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {suggestion.description}
                </p>
                {(suggestion.tagNames.length > 0 ||
                  suggestion.ageGroupNames.length > 0 ||
                  suggestion.equipmentNames.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.tagNames.map((name) => (
                      <Badge key={`t-${name}`} variant="info" size="sm">
                        {name}
                      </Badge>
                    ))}
                    {suggestion.ageGroupNames.map((name) => (
                      <Badge key={`g-${name}`} variant="violet" size="sm">
                        {name}
                      </Badge>
                    ))}
                    {suggestion.equipmentNames.map((name) => (
                      <Badge key={`e-${name}`} size="sm">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
                {result.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-xs text-gray-400">
                    <span>{t('ai.groupPicker.sources')}:</span>
                    {result.sources.map((source, si) => (
                      <a
                        key={si}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-0.5 text-sky-500 hover:text-sky-700"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {source.title ?? source.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400">
              {t('ai.generator.tokens', {
                input: result.usage.inputTokens,
                output: result.usage.outputTokens,
              })}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
