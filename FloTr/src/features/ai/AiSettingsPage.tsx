import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertTriangle, Share2, Trash2, Pencil, Zap, X } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { Modal } from '../../components/shared/Modal'
import { aiApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { AiCredentialDto, UpdateAiSettingsRequest } from '../../types/domain.types'
import { CredentialFormModal } from './CredentialFormModal'
import { providerLabel } from './aiProviders'
import { toast } from '../../utils/toast'

const SCOPE_GLOBAL = 1

export function AiSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAdmin, isHeadCoach, activeClubId, activeClubName, clubMemberships } = useAuthStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiCredentialDto | null>(null)
  const [deleting, setDeleting] = useState<AiCredentialDto | null>(null)
  const [sharing, setSharing] = useState<AiCredentialDto | null>(null)

  const { data: credentials } = useQuery({
    queryKey: ['ai-credentials'],
    queryFn: aiApi.getCredentials,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-credentials'] })
    queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
    queryClient.invalidateQueries({ queryKey: ['ai-status'] })
  }

  const onError = (err: unknown) => {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? t('ai.saveFailed'))
  }

  const activateMutation = useMutation({
    mutationFn: aiApi.activateCredential,
    onSuccess: invalidate,
    onError,
  })
  const deleteMutation = useMutation({
    mutationFn: aiApi.deleteCredential,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
    onError,
  })
  const revokeMutation = useMutation({
    mutationFn: ({ id, consentId }: { id: number; consentId: number }) =>
      aiApi.revokeConsent(id, consentId),
    onSuccess: () => {
      invalidate()
      toast.success(t('ai.shareRevoked'))
    },
    onError,
  })

  const testCredential = async (credential: AiCredentialDto) => {
    try {
      const result = await aiApi.validateCredential(credential.id)
      if (result.ok) toast.success(t('ai.testOk'))
      else toast.error(result.message ?? t('ai.testFailed'))
      invalidate()
    } catch {
      toast.error(t('ai.testFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('ai.title')} description={t('ai.subtitle')} />

      {/* ── My AI subscriptions ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('ai.myCredentials')}</h2>
              <p className="text-sm text-gray-500">{t('ai.myCredentialsHint')}</p>
            </div>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              {t('ai.addCredential')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!credentials?.length ? (
            <p className="py-4 text-sm text-gray-500">{t('ai.noCredentials')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {credentials.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="info">{providerLabel(c.provider)}</Badge>
                      {c.isActive && (
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('ai.active')}
                        </Badge>
                      )}
                      {c.needsReentry && (
                        <Badge variant="danger">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {t('ai.needsReentry')}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {c.model ?? t('ai.defaultModel')} · ••••{c.keyLast4} ·{' '}
                      {c.lastValidatedAt
                        ? t('ai.lastValidated', {
                            date: new Date(c.lastValidatedAt).toLocaleDateString(),
                          })
                        : t('ai.neverValidated')}
                    </div>
                    {c.consents.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-xs text-gray-500">{t('ai.sharedWith')}:</span>
                        {c.consents.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700"
                          >
                            {s.scope === SCOPE_GLOBAL ? t('ai.globalConsent') : s.clubName}
                            <button
                              type="button"
                              title={t('ai.revokeShare')}
                              aria-label={t('ai.revokeShare')}
                              className="text-sky-500 hover:text-red-600"
                              onClick={() => revokeMutation.mutate({ id: c.id, consentId: s.id })}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    {!c.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        title={t('ai.activateHint')}
                        onClick={() => activateMutation.mutate(c.id)}
                      >
                        <Zap className="mr-1 h-3.5 w-3.5" />
                        {t('ai.activate')}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => testCredential(c)}>
                      {t('ai.test')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title={t('ai.shareWithClub')}
                      onClick={() => setSharing(c)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={t('ai.edit')}
                      onClick={() => {
                        setEditing(c)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={t('ai.delete')}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Club AI (head coach picks the default; only Admin toggles Enabled) ── */}
      {isHeadCoach && activeClubId != null && (
        <ClubSettingsCard clubId={activeClubId} clubName={activeClubName} />
      )}

      {/* ── Global settings + per-club enablement (Admin) ────────────────── */}
      {isAdmin && <GlobalSettingsCard credentials={credentials ?? []} />}
      {isAdmin && <ClubsOverviewCard />}

      <CredentialFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        credential={editing}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={deleting != null}
        onClose={() => setDeleting(null)}
        title={t('ai.deleteTitle')}
      >
        <p className="text-sm text-gray-600">
          {t('ai.deleteConfirm', { name: deleting?.name ?? '' })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            {t('ai.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
          >
            {t('ai.delete')}
          </Button>
        </div>
      </Modal>

      {/* Share with a club */}
      <ShareModal
        credential={sharing}
        onClose={() => setSharing(null)}
        memberships={clubMemberships}
        isAdmin={isAdmin}
        onShared={invalidate}
      />
    </div>
  )
}

function ShareModal({
  credential,
  onClose,
  memberships,
  isAdmin,
  onShared,
}: {
  credential: AiCredentialDto | null
  onClose: () => void
  memberships: { clubId: number; clubName: string }[]
  isAdmin: boolean
  onShared: () => void
}) {
  const { t } = useTranslation()
  const [clubId, setClubId] = useState<number | ''>('')

  // Admin may share towards any club; regular owners only towards their own clubs.
  const { data: allClubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
    enabled: isAdmin && credential != null,
  })
  const clubOptions = (
    isAdmin && allClubs ? allClubs.map((c) => ({ clubId: c.id, clubName: c.name })) : memberships
  ).filter((c) => !credential?.consents.some((s) => s.clubId === c.clubId))

  const shareMutation = useMutation({
    mutationFn: ({ id, targetClubId }: { id: number; targetClubId: number }) =>
      aiApi.shareWithClub(id, targetClubId),
    onSuccess: () => {
      toast.success(t('ai.shared'))
      onShared()
      onClose()
      setClubId('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('ai.saveFailed'))
    },
  })

  return (
    <Modal isOpen={credential != null} onClose={onClose} title={t('ai.shareWithClub')}>
      <p className="text-sm text-gray-600">{t('ai.shareHint')}</p>
      <select
        className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        value={clubId}
        onChange={(e) => setClubId(e.target.value ? Number(e.target.value) : '')}
      >
        <option value="">{t('ai.selectClub')}</option>
        {clubOptions.map((c) => (
          <option key={c.clubId} value={c.clubId}>
            {c.clubName}
          </option>
        ))}
      </select>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {t('ai.cancel')}
        </Button>
        <Button
          disabled={clubId === ''}
          loading={shareMutation.isPending}
          onClick={() =>
            credential &&
            clubId !== '' &&
            shareMutation.mutate({ id: credential.id, targetClubId: clubId })
          }
        >
          {t('ai.share')}
        </Button>
      </div>
    </Modal>
  )
}

function ClubSettingsCard({ clubId, clubName }: { clubId: number; clubName: string | null }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthStore()

  const { data: settings } = useQuery({
    queryKey: ['ai-settings', 'club', clubId],
    queryFn: () => aiApi.getClubSettings(clubId),
  })
  const { data: eligible } = useQuery({
    queryKey: ['ai-settings', 'club', clubId, 'eligible'],
    queryFn: () => aiApi.getClubEligibleCredentials(clubId),
  })

  const saveMutation = useMutation({
    mutationFn: (data: UpdateAiSettingsRequest) => aiApi.updateClubSettings(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      queryClient.invalidateQueries({ queryKey: ['ai-status'] })
      toast.success(t('ai.saved'))
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('ai.saveFailed'))
    },
  })

  if (!settings) return null

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{t('ai.clubSection', { club: clubName ?? '' })}</h2>
        <p className="text-sm text-gray-500">{t('ai.clubSectionHint')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            disabled={!isAdmin}
            onChange={(e) =>
              saveMutation.mutate({
                enabled: e.target.checked,
                defaultCredentialId: settings.defaultCredentialId,
                defaultModel: settings.defaultModel,
              })
            }
          />
          {t('ai.enabled')}
          {!isAdmin && <span className="text-xs text-gray-400">({t('ai.enabledAdminOnly')})</span>}
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('ai.defaultCredential')}
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={settings.defaultCredentialId ?? ''}
            onChange={(e) =>
              saveMutation.mutate({
                enabled: settings.enabled,
                defaultCredentialId: e.target.value ? Number(e.target.value) : null,
                defaultModel: settings.defaultModel,
              })
            }
          >
            <option value="">{t('ai.defaultCredentialNone')}</option>
            {(eligible ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {providerLabel(c.provider)} ({c.ownerName})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{t('ai.defaultCredentialHint')}</p>
          {settings.defaultCredentialId != null && !settings.defaultValid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('ai.defaultInvalid')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function GlobalSettingsCard({ credentials }: { credentials: AiCredentialDto[] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['ai-settings', 'global'],
    queryFn: aiApi.getGlobalSettings,
  })

  const saveMutation = useMutation({
    mutationFn: aiApi.updateGlobalSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      queryClient.invalidateQueries({ queryKey: ['ai-status'] })
      queryClient.invalidateQueries({ queryKey: ['ai-credentials'] })
      toast.success(t('ai.saved'))
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('ai.saveFailed'))
    },
  })

  if (!settings) return null

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{t('ai.globalSection')}</h2>
        <p className="text-sm text-gray-500">{t('ai.globalSectionHint')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              saveMutation.mutate({
                enabled: e.target.checked,
                defaultCredentialId: settings.defaultCredentialId,
                defaultModel: settings.defaultModel,
              })
            }
          />
          {t('ai.killSwitch')}
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('ai.globalDefaultCredential')}
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={settings.defaultCredentialId ?? ''}
            onChange={(e) =>
              saveMutation.mutate({
                enabled: settings.enabled,
                defaultCredentialId: e.target.value ? Number(e.target.value) : null,
                defaultModel: settings.defaultModel,
              })
            }
          >
            <option value="">{t('ai.defaultCredentialNone')}</option>
            {credentials.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {providerLabel(c.provider)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{t('ai.globalDefaultHint')}</p>
          {settings.defaultCredentialId != null && !settings.defaultValid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('ai.defaultInvalid')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ClubsOverviewCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: clubSettings } = useQuery({
    queryKey: ['ai-settings', 'clubs'],
    queryFn: aiApi.getAllClubSettings,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ clubId, data }: { clubId: number; data: UpdateAiSettingsRequest }) =>
      aiApi.updateClubSettings(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      queryClient.invalidateQueries({ queryKey: ['ai-status'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('ai.saveFailed'))
    },
  })

  const clubName = (clubId: number | null | undefined) =>
    clubs?.find((c) => c.id === clubId)?.name ?? `#${clubId}`

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{t('ai.clubsOverview')}</h2>
        <p className="text-sm text-gray-500">{t('ai.clubsOverviewHint')}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">{t('ai.club')}</th>
                <th className="py-2 pr-4 font-medium">{t('ai.aiEnabled')}</th>
                <th className="py-2 font-medium">{t('ai.defaultCredential')}</th>
              </tr>
            </thead>
            <tbody>
              {(clubSettings ?? []).map((s) => (
                <tr key={s.clubId} className="border-b border-gray-50">
                  <td className="py-2 pr-4">{clubName(s.clubId)}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) =>
                        s.clubId != null &&
                        toggleMutation.mutate({
                          clubId: s.clubId,
                          data: {
                            enabled: e.target.checked,
                            defaultCredentialId: s.defaultCredentialId,
                            defaultModel: s.defaultModel,
                          },
                        })
                      }
                    />
                  </td>
                  <td className="py-2 text-gray-600">
                    {s.defaultCredentialName
                      ? `${s.defaultCredentialName} (${providerLabel(s.defaultCredentialProvider)})`
                      : '—'}
                    {s.defaultCredentialId != null && !s.defaultValid && (
                      <span className="ml-2 text-xs text-amber-600">{t('ai.defaultInvalid')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
