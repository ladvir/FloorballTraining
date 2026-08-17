import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Sparkles, AlertTriangle, Clock, Users, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { aiApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useAiActivityStore } from '../../store/aiActivityStore'
import type { ActivitySuggestionDto, ActivitySuggestionsResultDto } from '../../types/domain.types'

export function AiActivityImportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeClubId } = useAuthStore()
  const setSuggestion = useAiActivityStore((s) => s.setSuggestion)

  const [criteria, setCriteria] = useState('')
  const [count, setCount] = useState(2)
  const [result, setResult] = useState<ActivitySuggestionsResultDto | null>(null)

  const { data: status } = useQuery({
    queryKey: ['ai-status', activeClubId],
    queryFn: () => aiApi.getStatus(activeClubId),
    enabled: activeClubId != null,
  })

  const suggestMutation = useMutation({
    mutationFn: () =>
      aiApi.suggestActivities({ clubId: activeClubId!, criteria: criteria.trim(), count }),
    onSuccess: setResult,
  })
  const errorCode =
    (suggestMutation.error as { response?: { data?: { code?: string } } } | null)?.response?.data
      ?.code ?? 'unexpected'

  const handleUse = (suggestion: ActivitySuggestionDto) => {
    setSuggestion(suggestion)
    navigate('/activities/new')
  }

  if (status && (!status.enabled || !status.hasCredential)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('ai.activityImport.title')} />
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            {!status.enabled ? t('ai.generator.disabled') : t('ai.generator.noCredential')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ai.activityImport.title')}
        description={t('ai.activityImport.subtitle')}
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('ai.activityImport.criteria')}</h2>
          <p className="text-sm text-gray-500">{t('ai.activityImport.criteriaHint')}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={3}
            maxLength={2000}
            placeholder={t('ai.activityImport.criteriaPlaceholder')}
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
          <div className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('ai.activityImport.count')}
              </label>
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button
              disabled={criteria.trim().length < 5 || activeClubId == null}
              loading={suggestMutation.isPending}
              onClick={() => suggestMutation.mutate()}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {t('ai.activityImport.find')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestMutation.isError && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t(`ai.generator.errors.${errorCode}`, {
              defaultValue: t('ai.generator.errors.unexpected'),
            })}
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
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
          {result.suggestions.map((suggestion, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{suggestion.name}</h3>
                  <Button size="sm" onClick={() => handleUse(suggestion)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {t('ai.activityImport.editAndSave')}
                  </Button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {suggestion.durationMin}–{suggestion.durationMax} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {suggestion.personsMin}–{suggestion.personsMax}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
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
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-gray-400">
            {t('ai.generator.tokens', {
              input: result.usage.inputTokens,
              output: result.usage.outputTokens,
            })}
            {' · '}
            {t('ai.activityImport.nothingSavedHint')}
          </p>
        </div>
      )}
    </div>
  )
}
