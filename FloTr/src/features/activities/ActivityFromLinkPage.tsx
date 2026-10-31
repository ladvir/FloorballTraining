import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ExternalLink, Link2, Pencil, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/shared/PageHeader'
import { activitiesApi } from '../../api/activities.api'
import { aiApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useAiActivityStore } from '../../store/aiActivityStore'
import type { ActivitySuggestionDto } from '../../types/domain.types'
import {
  bestSourceText,
  buildAiCriteria,
  buildManualSuggestion,
  cleanSharedUrl,
  clearPendingShare,
  getSocialSource,
  loadPendingShare,
  withSourceLink,
  type PendingShare,
} from './sharedLink'

/**
 * "Activity from a shared link": an Instagram/Facebook post arrives via the PWA share
 * target (or is pasted here — iOS has no share target), the API reads its caption and the
 * user either lets AI turn it into a drill or prefills the form by hand. Nothing is saved
 * here; the activity form stores it and attaches the link as the activity's video.
 */
export function ActivityFromLinkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeClubId } = useAuthStore()
  const setSuggestion = useAiActivityStore((s) => s.setSuggestion)
  const setVideoLink = useAiActivityStore((s) => s.setVideoLink)

  const [share, setShare] = useState<PendingShare | null>(() => loadPendingShare())
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const source = getSocialSource(share?.url)
  const sourceLabel = t(`activities.fromLink.source.${source ?? 'other'}`)

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ['link-preview', share?.url],
    queryFn: () => activitiesApi.linkPreview(share!.url),
    enabled: !!share && source != null,
    staleTime: Infinity,
    retry: false,
  })

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status', activeClubId],
    queryFn: () => aiApi.getStatus(activeClubId),
    enabled: activeClubId != null,
  })
  const aiAvailable = !!aiStatus?.enabled && !!aiStatus.hasCredential && activeClubId != null

  const sourceText = share ? bestSourceText(preview, share) : ''

  const goToForm = (suggestion: ActivitySuggestionDto) => {
    if (!share) return
    setSuggestion(suggestion)
    setVideoLink({ url: share.url, title: suggestion.name })
    clearPendingShare()
    navigate('/activities/new')
  }

  const aiMutation = useMutation({
    mutationFn: () =>
      aiApi.suggestActivities({
        clubId: activeClubId!,
        criteria: buildAiCriteria(t('activities.fromLink.aiPrompt'), sourceText),
        count: 1,
      }),
    onSuccess: (result) => {
      const first = result.suggestions[0]
      if (first && share) goToForm(withSourceLink(first, share.url, sourceLabel))
    },
  })
  const aiErrorCode =
    (aiMutation.error as { response?: { data?: { code?: string } } } | null)?.response?.data
      ?.code ?? 'unexpected'
  const aiReturnedNothing = aiMutation.isSuccess && aiMutation.data.suggestions.length === 0

  const handleManual = () => {
    if (!share) return
    goToForm(
      buildManualSuggestion(
        share.url,
        sourceText,
        t('activities.fromLink.defaultName', { source: sourceLabel }),
        sourceLabel
      )
    )
  }

  const handlePaste = () => {
    const match = input.match(/https?:\/\/[^\s"'<>]+/i)
    let url: string | null = null
    try {
      url = match ? cleanSharedUrl(match[0]) : null
    } catch {
      url = null
    }
    if (!url || !getSocialSource(url)) {
      setInputError(t('activities.fromLink.unsupported'))
      return
    }
    setInputError(null)
    aiMutation.reset()
    setShare({ url, text: input })
  }

  const handleDiscard = () => {
    clearPendingShare()
    setShare(null)
    aiMutation.reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('activities.fromLink.title')}
        description={t('activities.fromLink.subtitle')}
      />

      {!share && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('activities.fromLink.pasteTitle')}</h2>
            <p className="text-sm text-gray-500">{t('activities.fromLink.pasteHint')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://www.instagram.com/reel/…"
              value={input}
              error={inputError ?? undefined}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePaste()}
            />
            <Button disabled={input.trim().length === 0} onClick={handlePaste}>
              <Link2 className="mr-1.5 h-4 w-4" />
              {t('activities.fromLink.load')}
            </Button>
          </CardContent>
        </Card>
      )}

      {share && source == null && (
        <Card>
          <CardContent className="flex items-start gap-2 py-4 text-sm text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2">
              <p>{t('activities.fromLink.unsupported')}</p>
              <p className="break-all text-gray-500">{share.url}</p>
              <Button size="sm" variant="outline" onClick={handleDiscard}>
                {t('activities.fromLink.other')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {share && source != null && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <Badge variant={source === 'instagram' ? 'violet' : 'info'} size="sm">
                {sourceLabel}
              </Badge>
              <a
                href={share.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
              >
                {t('activities.fromLink.openOriginal')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
              </div>
            ) : (
              <div className="flex gap-3">
                {preview?.imageUrl && (
                  <img
                    src={preview.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                {sourceText ? (
                  <p className="line-clamp-[10] whitespace-pre-wrap text-sm text-gray-700">
                    {sourceText}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">{t('activities.fromLink.noCaption')}</p>
                )}
              </div>
            )}

            <p className="break-all text-xs text-gray-400">{share.url}</p>

            {aiMutation.isError && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t(`ai.generator.errors.${aiErrorCode}`, {
                  defaultValue: t('ai.generator.errors.unexpected'),
                })}
              </p>
            )}
            {aiReturnedNothing && (
              <p className="text-sm text-amber-700">{t('activities.fromLink.aiNothing')}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {aiAvailable && (
                <Button
                  disabled={previewLoading || !sourceText}
                  loading={aiMutation.isPending}
                  onClick={() => aiMutation.mutate()}
                  title={!sourceText ? t('activities.fromLink.aiNeedsCaption') : undefined}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {t('activities.fromLink.useAi')}
                </Button>
              )}
              <Button
                variant={aiAvailable ? 'outline' : 'primary'}
                disabled={previewLoading || aiMutation.isPending}
                onClick={handleManual}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                {t('activities.fromLink.manual')}
              </Button>
              <Button variant="ghost" disabled={aiMutation.isPending} onClick={handleDiscard}>
                {t('activities.fromLink.other')}
              </Button>
            </div>
            <p className="text-xs text-gray-400">{t('activities.fromLink.videoHint')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
