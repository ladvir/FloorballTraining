import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/shared/PageHeader'
import { clubsApi, teamsApi, authApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, setUser, isAdmin } = useAuthStore()
  const currentLang =
    ['cs', 'sk', 'pl', 'de', 'en'].find((l) => i18n.language?.startsWith(l)) ?? 'cs'
  const [selectedClubId, setSelectedClubId] = useState<number | null>(user?.defaultClubId ?? null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(user?.defaultTeamId ?? null)

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const memberships = user?.clubMemberships ?? []
  const membershipClubIds = new Set(memberships.map((m) => m.clubId))
  const memberIdByClub = new Map(memberships.map((m) => [m.clubId, m.memberId]))

  const availableClubs = isAdmin
    ? (clubs ?? [])
    : (clubs ?? []).filter((c) => membershipClubIds.has(c.id))

  const isListedInTeam = (teamId: number, clubId?: number | null): boolean => {
    if (!clubId) return false
    const memberId = memberIdByClub.get(clubId)
    if (!memberId) return false
    const team = teams?.find((t) => t.id === teamId)
    return !!team?.teamMembers?.some((tm) => tm.memberId === memberId)
  }

  const filteredTeams = (
    selectedClubId ? (teams ?? []).filter((t) => t.clubId === selectedClubId) : (teams ?? [])
  ).filter((t) => isAdmin || isListedInTeam(t.id, t.clubId))

  const handleLanguageChange = async (lang: string) => {
    if (lang === currentLang) return
    await i18n.changeLanguage(lang)
    // Persist per-user immediately so the choice is restored on next login.
    try {
      const updated = await authApi.setLanguage(lang)
      setUser(updated)
    } catch {
      /* local + localStorage choice still applies */
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSuccess(false)
    try {
      // Save profile
      const profileData = await authApi.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() !== user?.email ? email.trim() : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })
      setUser(profileData)

      // Save preferences
      const prefsData = await authApi.updatePreferences({
        defaultClubId: selectedClubId,
        defaultTeamId: selectedTeamId,
      })
      setUser(prefsData)

      setCurrentPassword('')
      setNewPassword('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('profile.saved')
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('profile.title')} />

      {/* Profile info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-600">
              {(user?.firstName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t('profile.role')}
            </p>
            <div className="mt-1 flex gap-2">
              {user?.roles.map((role) => (
                <Badge key={role} variant={role === 'Admin' ? 'info' : 'default'}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI assistant settings */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium text-gray-900">{t('ai.title')}</p>
            <p className="text-sm text-gray-500">{t('ai.profileLinkHint')}</p>
          </div>
          <Link to="/settings/ai">
            <Button variant="outline">{t('ai.manage')}</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('profile.firstName')} &amp; {t('profile.lastName')}
      </h2>
      <Card className="mb-6">
        <CardContent className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('profile.firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label={t('profile.lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <Input
            label={t('profile.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-sm font-medium text-gray-700">{t('profile.changePassword')}</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('profile.currentPassword')}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('profile.currentPassword')}
              />
              <Input
                label={t('profile.newPassword')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.newPassword')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('nav.profileSettings')}
      </h2>
      <Card>
        <CardContent className="space-y-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('profile.language')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="cs">{t('profile.languageCs')}</option>
              <option value="sk">{t('profile.languageSk')}</option>
              <option value="pl">{t('profile.languagePl')}</option>
              <option value="de">{t('profile.languageDe')}</option>
              <option value="en">{t('profile.languageEn')}</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700">
              {t('profile.club')} &amp; {t('common.team')}
            </p>
            <p className="text-xs text-gray-500">{t('clubs.description')}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('profile.club')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedClubId ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value)
                const newClubId = val === 0 ? null : val
                setSelectedClubId(newClubId)
                if (selectedTeamId) {
                  const team = teams?.find((t) => t.id === selectedTeamId)
                  if (!team || (newClubId && team.clubId !== newClubId)) setSelectedTeamId(null)
                }
              }}
            >
              <option value={0}>— {t('common.none')} —</option>
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!isAdmin && availableClubs.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">{t('members.filterClub')}</p>
            )}
            {!isAdmin && <p className="mt-1 text-xs text-gray-500">{t('clubs.activeClub')}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('common.team')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedTeamId ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value)
                setSelectedTeamId(val === 0 ? null : val)
              }}
            >
              <option value={0}>— {t('common.none')} —</option>
              {filteredTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedClubId && filteredTeams.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {isAdmin ? t('teams.noTeams') : t('teams.noTeamsDesc')}
              </p>
            )}
            {!isAdmin && <p className="mt-1 text-xs text-gray-500">{t('teams.filterSeason')}</p>}
          </div>
        </CardContent>
      </Card>

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {t('profile.saved')}
        </div>
      )}
      {saveError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      <div className="mt-4 flex justify-end pb-8">
        <Button loading={saving} onClick={handleSave}>
          {t('profile.save')}
        </Button>
      </div>
    </div>
  )
}
