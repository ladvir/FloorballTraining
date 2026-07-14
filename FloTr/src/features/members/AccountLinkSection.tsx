import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Link2, Link2Off, UserPlus, Search, Check, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { membersApi } from '../../api/index'
import { usersApi } from '../../api/users.api'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import { dfLocale } from '../../utils/dateLocale'
import { SUPPORTED_LANGUAGES, canCreateLogin, canManageLink, linkState } from './accountLink'
import type { LinkCandidateDto, MemberDto } from '../../types/domain.types'

function LanguageSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (lang: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-400"
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <option key={code} value={code}>
          {t(`profile.language${code.charAt(0).toUpperCase()}${code.slice(1)}`)}
        </option>
      ))}
    </select>
  )
}

/**
 * Manage the login account linked to a member: create a login, link/unlink an
 * existing user, and set the account's preferred language. Self-fetches the
 * member detail (account-status fields) so callers only pass the id.
 */
export function AccountLinkSection({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { effectiveRole, activeClubId, isAdmin } = useAuthStore()

  const { data: member } = useQuery({
    queryKey: ['member', String(memberId)],
    queryFn: () => membersApi.getById(memberId),
  })

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [showCreateLogin, setShowCreateLogin] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [sendCredentials, setSendCredentials] = useState(false)
  const [createLang, setCreateLang] = useState('cs')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['member', String(memberId)] })
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const { data: candidates } = useQuery({
    queryKey: ['link-candidates', memberId, candidateSearch],
    queryFn: () => membersApi.linkCandidates(memberId, candidateSearch || undefined),
    enabled: showLinkPicker,
  })

  const errText = (err: unknown, fallback: string) => {
    const axiosErr = err as { response?: { data?: { message?: string } | string } }
    return (
      (axiosErr.response?.data as { message?: string })?.message ??
      (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
      fallback
    )
  }

  const createLoginMutation = useMutation({
    mutationFn: () =>
      membersApi.createLogin(memberId, {
        password: newPassword || undefined,
        sendCredentials,
        language: createLang,
      }),
    onSuccess: (res) => {
      setShowCreateLogin(false)
      setNewPassword('')
      setSendCredentials(false)
      setFeedback({
        type: 'success',
        text: res.password
          ? t('members.account.loginCreatedWithPassword', { password: res.password })
          : t('members.account.loginCreated'),
      })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.account.createLoginFailed')) }),
  })

  const linkMutation = useMutation({
    mutationFn: (userId: string) => membersApi.linkUser(memberId, userId),
    onSuccess: () => {
      setShowLinkPicker(false)
      setCandidateSearch('')
      setFeedback({ type: 'success', text: t('members.account.linked') })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.account.linkFailed')) }),
  })

  const unlinkMutation = useMutation({
    mutationFn: () => membersApi.unlinkUser(memberId),
    onSuccess: () => {
      setFeedback({ type: 'success', text: t('members.account.unlinked') })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.account.unlinkFailed')) }),
  })

  const languageMutation = useMutation({
    mutationFn: (lang: string) =>
      usersApi.updateProfile(member!.appUserId!, { preferredLanguage: lang }),
    onSuccess: () => {
      setFeedback({ type: 'success', text: t('members.account.languageSaved') })
      invalidate()
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.account.languageFailed')) }),
  })

  const setPasswordMutation = useMutation({
    mutationFn: (password: string) => usersApi.setPassword(member!.appUserId!, password),
    onSuccess: () => {
      setNewPassword('')
      setFeedback({ type: 'success', text: t('members.setPasswordSuccess') })
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: errText(err, t('members.setPasswordFailed')) }),
  })

  if (!member) return null

  const canManage = canManageLink(effectiveRole, member.clubId, activeClubId)
  if (!canManage) return null

  const isLinked = linkState(member) === 'linked'

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <KeyRound className="h-3.5 w-3.5 text-gray-400" />
        {t('members.account.title')}
      </div>

      {isLinked ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              <Check className="mr-1 inline h-3 w-3" />
              {t('members.account.linkedBadge')}
            </Badge>
            {member.appUserEmail && (
              <span className="text-xs text-gray-600">{member.appUserEmail}</span>
            )}
          </div>
          {member.lastLoginAt ? (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {t('members.account.lastLogin')}:{' '}
              {format(parseISO(member.lastLoginAt), 'd. M. yyyy HH:mm', { locale: dfLocale() })}
            </p>
          ) : (
            <p className="text-xs text-gray-400">{t('admin.userNeverLoggedIn')}</p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t('profile.language')}
            </label>
            <LanguageSelect
              value={member.preferredLanguage ?? 'cs'}
              onChange={(lang) => languageMutation.mutate(lang)}
              disabled={languageMutation.isPending}
            />
          </div>

          {isAdmin && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('members.setPassword')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('members.setPasswordMinChars')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => setPasswordMutation.mutate(newPassword)}
                  loading={setPasswordMutation.isPending}
                  disabled={newPassword.length < 6 || setPasswordMutation.isPending}
                >
                  {t('members.setPasswordSet')}
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              confirm(t('members.account.unlinkPrompt'), () => unlinkMutation.mutate())
            }
            disabled={unlinkMutation.isPending}
          >
            <Link2Off className="h-3.5 w-3.5" />
            {t('members.account.unlink')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{t('members.account.noLogin')}</p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canCreateLogin(member)}
              title={!canCreateLogin(member) ? t('members.account.needEmail') : undefined}
              onClick={() => {
                setShowCreateLogin((v) => !v)
                setShowLinkPicker(false)
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t('members.account.createLogin')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLinkPicker((v) => !v)
                setShowCreateLogin(false)
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              {t('members.account.linkExisting')}
            </Button>
          </div>

          {showCreateLogin && (
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                {t('members.account.createLoginFor', { email: member.email })}
              </p>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder={t('members.account.passwordOptional')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('profile.language')}
                </label>
                <LanguageSelect value={createLang} onChange={setCreateLang} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={sendCredentials}
                  onChange={(e) => setSendCredentials(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                />
                {t('members.account.sendCredentials')}
              </label>
              <Button
                size="sm"
                onClick={() => createLoginMutation.mutate()}
                loading={createLoginMutation.isPending}
                disabled={createLoginMutation.isPending}
              >
                {t('members.account.createLogin')}
              </Button>
            </div>
          )}

          {showLinkPicker && (
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder={t('members.account.searchUser')}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {(candidates ?? []).length === 0 ? (
                  <p className="py-2 text-center text-xs text-gray-400">
                    {t('members.account.noCandidates')}
                  </p>
                ) : (
                  (candidates ?? []).map((c: LinkCandidateDto) => (
                    <button
                      key={c.userId}
                      type="button"
                      onClick={() => linkMutation.mutate(c.userId)}
                      disabled={linkMutation.isPending}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50"
                    >
                      <span>
                        <span className="font-medium text-gray-800">
                          {c.firstName || c.lastName
                            ? `${c.firstName} ${c.lastName}`.trim()
                            : c.email}
                        </span>
                        <span className="block text-xs text-gray-500">{c.email}</span>
                      </span>
                      <Link2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

/** Compact linked/roster badge for list & header contexts. */
export function AccountStatusBadge({
  member,
}: {
  member: Pick<MemberDto, 'appUserId' | 'hasLogin'>
}) {
  const { t } = useTranslation()
  return linkState(member) === 'linked' ? (
    <Badge variant="success">
      <Link2 className="mr-1 inline h-3 w-3" />
      {t('members.account.linkedBadge')}
    </Badge>
  ) : (
    <Badge variant="default">
      <Link2Off className="mr-1 inline h-3 w-3" />
      {t('members.account.noLoginBadge')}
    </Badge>
  )
}
