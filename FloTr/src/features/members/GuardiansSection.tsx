import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Trash2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { membersApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import { SUPPORTED_LANGUAGES, canManageLink } from './accountLink'
import { formatFullName } from '../../utils/name'
import type { GuardianDto, MemberDto } from '../../types/domain.types'

const RELATIONSHIP_KEYS = ['relationshipParent', 'relationshipGrandparent', 'relationshipOther']

/**
 * Manage the guardians (parents) linked to a child member: invite a parent by
 * e-mail (creates a login if new) and remove links. Coach+ only. The guardian
 * then sees their child read-only in the FlotrPlayer app.
 */
export function GuardiansSection({ member }: { member: MemberDto }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { effectiveRole, activeClubId } = useAuthStore()

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [sendCredentials, setSendCredentials] = useState(false)
  const [lang, setLang] = useState('cs')
  const [relationship, setRelationship] = useState<number | ''>('')

  const { data: guardians } = useQuery({
    queryKey: ['guardians', member.id],
    queryFn: () => membersApi.guardians(member.id),
    enabled: canManageLink(effectiveRole, member.clubId, activeClubId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['guardians', member.id] })

  const errText = (err: unknown, fallback: string) => {
    const axiosErr = err as { response?: { data?: { message?: string } | string } }
    return (
      (axiosErr.response?.data as { message?: string })?.message ??
      (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
      fallback
    )
  }

  const addMutation = useMutation({
    mutationFn: () =>
      membersApi.addGuardian(member.id, {
        email: email.trim(),
        sendCredentials,
        language: lang,
        relationship: relationship === '' ? undefined : relationship,
      }),
    onSuccess: (res) => {
      setShowAdd(false)
      setEmail('')
      setSendCredentials(false)
      setRelationship('')
      setFeedback({
        type: 'success',
        text: res.password
          ? t('members.guardians.addedWithPassword', { password: res.password })
          : t('members.guardians.added'),
      })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.guardians.addFailed')) }),
  })

  const removeMutation = useMutation({
    mutationFn: (linkId: number) => membersApi.removeGuardian(linkId),
    onSuccess: () => {
      setFeedback({ type: 'success', text: t('members.guardians.removed') })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.guardians.removeFailed')) }),
  })

  const resendMutation = useMutation({
    mutationFn: (linkId: number) => membersApi.resendGuardian(linkId),
    onSuccess: (res) => {
      setFeedback({
        type: 'success',
        text: res.emailSent
          ? t('members.guardians.resentWithPassword', { password: res.password })
          : t('members.guardians.resentEmailFailed', { password: res.password }),
      })
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.guardians.resendFailed')) }),
  })

  if (!canManageLink(effectiveRole, member.clubId, activeClubId)) return null

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Users className="h-3.5 w-3.5 text-gray-400" />
        {t('members.guardians.title')}
      </div>

      {(guardians ?? []).length === 0 ? (
        <p className="text-xs text-gray-500">{t('members.guardians.none')}</p>
      ) : (
        <ul className="space-y-1">
          {(guardians ?? []).map((g: GuardianDto) => (
            <li
              key={g.linkId}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-gray-800">
                  {g.firstName || g.lastName ? formatFullName(g.firstName, g.lastName) : g.email}
                </span>
                {(g.firstName || g.lastName) && (
                  <span className="block text-xs text-gray-500">{g.email}</span>
                )}
                {g.relationship != null && (
                  <span className="block text-xs text-gray-400">
                    {t(`members.guardians.${RELATIONSHIP_KEYS[g.relationship]}`)}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resendMutation.mutate(g.linkId)}
                  disabled={resendMutation.isPending}
                  className="text-gray-400 hover:text-sky-600"
                  title={t('members.guardians.resend')}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirm(t('members.guardians.removePrompt'), () =>
                      removeMutation.mutate(g.linkId)
                    )
                  }
                  disabled={removeMutation.isPending}
                  className="text-gray-400 hover:text-red-500"
                  title={t('members.guardians.remove')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {!showAdd ? (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            {t('members.guardians.invite')}
          </Button>
        ) : (
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-600">{t('members.guardians.inviteHint')}</p>
            <Input
              type="email"
              autoComplete="off"
              placeholder={t('members.guardians.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('profile.language')}
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SUPPORTED_LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {t(`profile.language${code.charAt(0).toUpperCase()}${code.slice(1)}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('members.guardians.relationship')}
              </label>
              <select
                value={relationship}
                onChange={(e) =>
                  setRelationship(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">{t('members.guardians.relationshipUnspecified')}</option>
                {RELATIONSHIP_KEYS.map((key, i) => (
                  <option key={key} value={i}>
                    {t(`members.guardians.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={sendCredentials}
                onChange={(e) => setSendCredentials(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
              />
              {t('members.guardians.sendCredentials')}
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addMutation.mutate()}
                loading={addMutation.isPending}
                disabled={addMutation.isPending || email.trim().length === 0}
              >
                {t('members.guardians.invite')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <p
          className={`mt-2 text-xs ${feedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  )
}
