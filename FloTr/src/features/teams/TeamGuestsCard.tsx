import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, UserPlus, Trash2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { teamGuestsApi } from '../../api/teamGuests.api'
import { useConfirm } from '../../store/confirmStore'
import { formatFullName } from '../../utils/name'

/** Read-only guest accounts of a team (HeadCoach+): invite by e-mail, reset password, remove. */
export function TeamGuestsCard({ teamId }: { teamId: number }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const queryKey = ['team-guests', teamId]

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [sendCredentials, setSendCredentials] = useState(true)

  const { data: guests = [] } = useQuery({ queryKey, queryFn: () => teamGuestsApi.list(teamId) })

  const errText = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  const done = (text: string) => {
    setFeedback({ ok: true, text })
    queryClient.invalidateQueries({ queryKey })
  }
  const failed = (err: unknown, fallback: string) =>
    setFeedback({ ok: false, text: errText(err, fallback) })

  const addMutation = useMutation({
    mutationFn: () =>
      teamGuestsApi.add(teamId, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        sendCredentials,
        language: i18n.language.slice(0, 2),
        password: password || undefined,
      }),
    onSuccess: (res) => {
      setShowAdd(false)
      setEmail('')
      setFirstName('')
      setLastName('')
      setPassword('')
      done(
        res.password
          ? t('teams.guests.addedWithPassword', { password: res.password })
          : t('teams.guests.added')
      )
    },
    onError: (err) => failed(err, t('teams.guests.addFailed')),
  })

  const removeMutation = useMutation({
    mutationFn: (linkId: number) => teamGuestsApi.remove(teamId, linkId),
    onSuccess: () => done(t('teams.guests.removed')),
    onError: (err) => failed(err, t('teams.guests.removeFailed')),
  })

  const resendMutation = useMutation({
    mutationFn: (linkId: number) => teamGuestsApi.resend(teamId, linkId),
    onSuccess: (res) =>
      done(
        res.emailSent
          ? t('teams.guests.resent')
          : t('teams.guests.resentWithPassword', { password: res.password })
      ),
    onError: (err) => failed(err, t('teams.guests.resendFailed')),
  })

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Eye className="h-3.5 w-3.5 text-gray-400" />
          {t('teams.guests.title')} ({guests.length})
        </div>
        <p className="mb-3 text-xs text-gray-500">{t('teams.guests.hint')}</p>

        <ul className="space-y-1">
          {guests.map((g) => (
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
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resendMutation.mutate(g.linkId)}
                  disabled={resendMutation.isPending}
                  className="text-gray-400 hover:text-sky-600"
                  title={t('teams.guests.resend')}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirm(t('teams.guests.removePrompt'), () => removeMutation.mutate(g.linkId))
                  }
                  disabled={removeMutation.isPending}
                  className="text-gray-400 hover:text-red-500"
                  title={t('teams.guests.remove')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          {!showAdd ? (
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {t('teams.guests.invite')}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <Input
                type="email"
                autoComplete="off"
                placeholder={t('teams.guests.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder={t('teams.guests.firstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder={t('teams.guests.lastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder={t('teams.guests.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={sendCredentials}
                  onChange={(e) => setSendCredentials(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                />
                {t('teams.guests.sendCredentials')}
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addMutation.mutate()}
                  loading={addMutation.isPending}
                  disabled={
                    addMutation.isPending ||
                    email.trim().length === 0 ||
                    (password.length > 0 && password.length < 6)
                  }
                >
                  {t('teams.guests.invite')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {feedback && (
          <p className={`mt-2 text-xs ${feedback.ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {feedback.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
