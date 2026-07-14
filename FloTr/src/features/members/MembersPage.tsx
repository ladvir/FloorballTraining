import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Search,
  Upload,
  Check,
  AlertTriangle,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { membersApi, clubsApi, teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { AccountLinkSection } from './AccountLinkSection'
import type { MemberDto, ClubDto, TeamDto } from '../../types/domain.types'

type MemberSortKey = 'lastName' | 'firstName' | 'role'

// Club-role precedence used when sorting the "Role" column (higher = more senior).
function memberRoleRank(m: MemberDto): number {
  if (m.hasClubRoleClubAdmin) return 3
  if (m.hasClubRoleMainCoach) return 2
  if (m.hasClubRoleCoach) return 1
  return 0
}

function SortHeader({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  columnKey: MemberSortKey
  activeKey: MemberSortKey
  dir: 'asc' | 'desc'
  onSort: (k: MemberSortKey) => void
}) {
  const active = activeKey === columnKey
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-gray-700 ${
          active ? 'text-gray-700' : ''
        }`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  )
}

export function MembersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isHeadCoach, activeClubId } = useAuthStore()
  const canManage = isAdmin || isHeadCoach
  const queryClient = useQueryClient()
  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  })
  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'all' | 'coaches' | 'players'>('all')
  const [sortKey, setSortKey] = useState<MemberSortKey>('lastName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: MemberSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MemberDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<MemberDto | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
  } | null>(null)

  const createMutation = useMutation({
    mutationFn: ({
      data,
      opts,
    }: {
      data: Partial<MemberDto>
      opts?: { sendCredentials?: boolean; language?: string }
    }) => membersApi.create(data, opts),
    onSuccess: (res, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
      // Surface an auto-generated password (not e-mailed) so it can be handed over.
      if (res.loginCreated && res.password && data.email) {
        setCreatedCredentials({ email: data.email, password: res.password })
      }
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MemberDto>) => membersApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (member: MemberDto) => membersApi.delete(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeleteConfirm(null)
      setDeleteError(null)
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (axiosErr.response?.data as { message?: string })?.message ??
        (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
        t('members.deleteError')
      setDeleteError(msg)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (member: MemberDto) => {
    setEditing(member)
    setModalOpen(true)
  }

  // Open edit modal when navigated from detail page
  useEffect(() => {
    const state = location.state as { editMemberId?: number } | null
    if (state?.editMemberId && members) {
      const m = members.find((m) => m.id === state.editMemberId)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: open modal from navigation state
      if (m) openEdit(m)
      // Clear state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, members]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = members
    ?.filter((m) => {
      if (!showInactive && !m.isActive) return false
      if (roleFilter !== 'all') {
        const isCoach = !!(m.hasClubRoleCoach || m.hasClubRoleMainCoach)
        if (roleFilter === 'coaches' && !isCoach) return false
        if (roleFilter === 'players' && isCoach) return false
      }
      if (search) {
        const s = search.toLowerCase()
        return (
          m.firstName.toLowerCase().includes(s) ||
          m.lastName.toLowerCase().includes(s) ||
          m.email?.toLowerCase().includes(s) ||
          String(m.birthYear).includes(s)
        )
      }
      return true
    })
    .slice()
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      let cmp = 0
      if (sortKey === 'role') {
        cmp = memberRoleRank(a) - memberRoleRank(b)
      } else {
        cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '', 'cs', { sensitivity: 'base' })
      }
      // Stable tiebreaker by last name so equal keys keep a predictable order.
      if (cmp === 0 && sortKey !== 'lastName') {
        cmp = a.lastName.localeCompare(b.lastName, 'cs', { sensitivity: 'base' })
      }
      return cmp * dir
    })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title={t('members.title')}
        action={
          canManage ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportModalOpen(true)}>
                <Upload className="h-4 w-4" />
                {t('members.importMembers')}
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t('members.newMember')}
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('members.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | 'coaches' | 'players')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">{t('members.filterAllRoles')}</option>
          <option value="coaches">{t('members.filterCoaches')}</option>
          <option value="players">{t('members.filterPlayers')}</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
          />
          {t('members.showInactive')}
        </label>
      </div>

      {!filtered?.length ? (
        <EmptyState
          title={t('members.emptyTitle')}
          description={search ? t('members.noResults') : t('members.noMembersDesc')}
          action={
            canManage && !search ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t('members.newMember')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <SortHeader
                  label={t('members.formLastName')}
                  columnKey="lastName"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label={t('members.formFirstName')}
                  columnKey="firstName"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label={t('members.colRole')}
                  columnKey="role"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                {canManage && (
                  <th className="px-4 py-3 text-right w-20">{t('members.colActions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => {
                const roles = [
                  m.hasClubRoleClubAdmin && t('members.roleClubAdmin'),
                  m.hasClubRoleMainCoach && t('members.roleMainCoach'),
                  m.hasClubRoleCoach && !m.hasClubRoleMainCoach && t('members.roleCoach'),
                ].filter(Boolean)
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-50 cursor-pointer ${!m.isActive ? 'opacity-50' : ''}`}
                    onClick={() => navigate(`/members/${m.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="hover:text-sky-600 hover:underline">{m.lastName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="hover:text-sky-600 hover:underline">{m.firstName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {roles.length ? roles.join(', ') : '–'}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(m)
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title={t('common.edit')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteError(null)
                                setDeleteConfirm(m)
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title={t('common.deletePermanently')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            {t('members.showingOf', { count: filtered.length, total: members?.length ?? 0 })}
          </div>
        </div>
      )}

      {canManage && (
        <>
          <MemberFormModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditing(null)
            }}
            member={editing}
            clubs={clubs ?? []}
            canChangeClub={isAdmin}
            onSave={(data, opts) => {
              if (editing) {
                saveMutation.mutate({ ...data, id: editing.id })
              } else {
                createMutation.mutate({ data, opts })
              }
            }}
            saving={createMutation.isPending || saveMutation.isPending}
          />

          <ImportExcelModal
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            clubId={activeClubId}
            teams={teams ?? []}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
          />

          <Modal
            isOpen={!!deleteConfirm}
            onClose={() => {
              setDeleteConfirm(null)
              setDeleteError(null)
            }}
            title={t('members.deleteConfirm')}
            maxWidth="sm"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{t('members.deleteConfirmFull')}</span>
              </div>
              <p className="text-xs text-gray-500">{t('members.deletePreferDeactivate')}</p>
              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirm(null)
                    setDeleteError(null)
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                  loading={deleteMutation.isPending}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('members.deletePermanently')}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={!!createdCredentials}
            onClose={() => setCreatedCredentials(null)}
            title={t('members.account.loginCreated')}
            maxWidth="sm"
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{t('members.account.credentialsHint')}</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <p>
                  <span className="text-gray-500">{t('members.formEmail')}:</span>{' '}
                  <span className="font-medium text-gray-900">{createdCredentials?.email}</span>
                </p>
                <p className="mt-1">
                  <span className="text-gray-500">{t('auth.password')}:</span>{' '}
                  <span className="font-mono font-medium text-gray-900">
                    {createdCredentials?.password}
                  </span>
                </p>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setCreatedCredentials(null)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}

// ── Member Form Modal ──────────────────────────────────────────────────────

function MemberFormModal({
  isOpen,
  onClose,
  member,
  clubs,
  canChangeClub,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  member: MemberDto | null
  clubs: ClubDto[]
  canChangeClub: boolean
  onSave: (
    data: Partial<MemberDto>,
    opts?: { sendCredentials?: boolean; language?: string }
  ) => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<number | ''>('')
  const [clubId, setClubId] = useState<number | ''>('')
  const [hasClubRoleClubAdmin, setHasClubRoleClubAdmin] = useState(false)
  const [hasClubRoleMainCoach, setHasClubRoleMainCoach] = useState(false)
  const [hasClubRoleCoach, setHasClubRoleCoach] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [language, setLanguage] = useState('cs')
  const [sendCredentials, setSendCredentials] = useState(false)

  useResetOnOpen(
    isOpen,
    useCallback(() => {
      setFirstName(member?.firstName ?? '')
      setLastName(member?.lastName ?? '')
      setBirthYear(member?.birthYear ? String(member.birthYear) : '')
      setEmail(member?.email ?? '')
      setGender(member?.gender ?? '')
      setClubId(member?.clubId ?? '')
      setHasClubRoleClubAdmin(member?.hasClubRoleClubAdmin ?? false)
      setHasClubRoleMainCoach(member?.hasClubRoleMainCoach ?? false)
      setHasClubRoleCoach(member?.hasClubRoleCoach ?? false)
      setIsActive(member?.isActive ?? true)
      setLanguage('cs')
      setSendCredentials(false)
    }, [member])
  )

  const currentYear = new Date().getFullYear()
  const birthYearNum = birthYear ? Number(birthYear) : 0
  const birthYearValid = birthYearNum >= 1900 && birthYearNum <= currentYear

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? t('members.editMember') : t('members.newMember')}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(
            {
              firstName,
              lastName,
              birthYear: Number(birthYear),
              email: email || undefined,
              gender: gender === '' ? undefined : Number(gender),
              clubId: clubId ? Number(clubId) : undefined,
              isActive,
              hasClubRoleClubAdmin,
              hasClubRoleMainCoach,
              hasClubRoleCoach,
            },
            { sendCredentials, language }
          )
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('members.formFirstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label={t('members.formLastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label={t('members.birthYear')}
                type="number"
                min={1900}
                max={currentYear}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                required
                placeholder={t('activities.egValue', { n: 2015 })}
              />
              {birthYear && !birthYearValid && (
                <p className="mt-1 text-xs text-red-500">
                  {t('members.birthYearRange', { min: 1900, max: currentYear })}
                </p>
              )}
            </div>
            <Input
              label={t('members.formEmail')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members.gender')}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">{t('members.genderUnspecified')}</option>
              <option value={0}>{t('members.genderMale')}</option>
              <option value={1}>{t('members.genderFemale')}</option>
            </select>
          </div>

          {/* New member: a login account is created automatically when an e-mail is given. */}
          {!member && (
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-3">
              {email.trim() ? (
                <>
                  <p className="text-xs text-sky-700">{t('members.account.willCreateLogin')}</p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('profile.language')}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="cs">{t('profile.languageCs')}</option>
                      <option value="sk">{t('profile.languageSk')}</option>
                      <option value="pl">{t('profile.languagePl')}</option>
                      <option value="de">{t('profile.languageDe')}</option>
                      <option value="en">{t('profile.languageEn')}</option>
                    </select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={sendCredentials}
                      onChange={(e) => setSendCredentials(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                    />
                    {t('members.account.sendCredentials')}
                  </label>
                </>
              ) : (
                <p className="text-xs text-gray-500">{t('members.account.noEmailNoLogin')}</p>
              )}
            </div>
          )}

          {/* Club selector — only for users who can change club */}
          {canChangeClub && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('members.clubLabel')}
              </label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                <option value="">{t('teams.selectPlaceholder')}</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('members.clubRoles')}</label>
            <div className="space-y-2">
              {[
                {
                  label: t('members.roleClubAdmin'),
                  checked: hasClubRoleClubAdmin,
                  set: setHasClubRoleClubAdmin,
                },
                {
                  label: t('members.roleMainCoach'),
                  checked: hasClubRoleMainCoach,
                  set: setHasClubRoleMainCoach,
                },
                {
                  label: t('members.roleCoach'),
                  checked: hasClubRoleCoach,
                  set: setHasClubRoleCoach,
                },
              ].map(({ label, checked, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active status — deactivate/reactivate the member (edit mode only) */}
          {member && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
              />
              <span className="text-sm text-gray-700">{t('members.activeMember')}</span>
            </label>
          )}

          {/* Login account — link/unlink, create login, language (only when editing) */}
          {member && <AccountLinkSection memberId={member.id} />}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              !firstName.trim() ||
              !lastName.trim() ||
              !birthYearValid ||
              (canChangeClub && !clubId) ||
              saving
            }
          >
            {saving ? t('members.savingDots') : member ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Import Excel Modal ─────────────────────────────────────────────────────

function ImportExcelModal({
  isOpen,
  onClose,
  clubId,
  teams,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  clubId: number | null
  teams: TeamDto[]
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const [teamId, setTeamId] = useState<number | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<{
    totalRead: number
    imported: number
    skipped: number
    skippedNames: string[]
    errors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredTeams = teams.filter((tm) => tm.clubId === clubId)

  const importMutation = useMutation({
    mutationFn: () => membersApi.importExcel(file!, clubId!, teamId ? Number(teamId) : undefined),
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      onSuccess()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setError(data?.message ?? t('members.importFailed'))
      setResult(null)
    },
  })

  // Reset on open
  useResetOnOpen(
    isOpen,
    useCallback(() => {
      setTeamId('')
      setFile(null)
      setResult(null)
      setError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('members.importFromExcel')} maxWidth="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t('members.importExcelDesc')}</p>

        {/* Team selector (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('members.importTeamOptional')}
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={!clubId}
          >
            <option value="">{t('members.importNoTeam')}</option>
            {filteredTeams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </div>

        {/* File input */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('members.importExcelFile')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
          />
        </div>

        {/* Import result */}
        {result && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
              <Check className="h-4 w-4" />
              {t('members.importDone')}
            </div>
            <div className="text-green-600 space-y-0.5">
              <p>
                {t('members.importRead')} <strong>{result.totalRead}</strong>
              </p>
              <p>
                {t('members.importImported')} <strong>{result.imported}</strong>
              </p>
              <p>
                {t('members.importSkipped')} <strong>{result.skipped}</strong>
              </p>
              {result.skippedNames.length > 0 && (
                <p className="text-orange-600 mt-1">
                  {t('members.importSkippedNames')} {result.skippedNames.join(', ')}
                </p>
              )}
              {result.errors.length > 0 && (
                <p className="text-red-600 mt-1">
                  {t('members.importErrors')} {result.errors.join('; ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {result ? t('common.close') : t('common.cancel')}
          </Button>
          {!result && (
            <Button
              size="sm"
              disabled={!clubId || !file || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? t('members.importingDots') : t('members.importBtn')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function useResetOnOpen(isOpen: boolean, onReset: () => void) {
  const prevRef = useRef(false)
  useEffect(() => {
    if (isOpen && !prevRef.current) onReset()
    prevRef.current = isOpen
  }, [isOpen, onReset])
}
