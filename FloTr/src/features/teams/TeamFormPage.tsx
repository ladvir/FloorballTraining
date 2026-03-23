import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Calendar, Check, Plus, Trash2, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { teamsApi, ageGroupsApi, clubsApi, seasonsApi, membersApi } from '../../api/index'
import type { ICalImportResult } from '../../api/index'
import type { MemberDto, TeamMemberDto } from '../../types/domain.types'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Název týmu je povinný'),
  ageGroupId: z.coerce.number({ error: 'Vyberte věkovou skupinu' }).min(1, 'Vyberte věkovou skupinu'),
  clubId: z.coerce.number({ error: 'Vyberte klub' }).min(1, 'Vyberte klub'),
  seasonId: z.coerce.number().optional().or(z.literal('')),
  personsMin: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
  personsMax: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
  defaultTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
  maxTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
  maxTrainingPartDuration: z.coerce.number().min(1).max(120).optional().or(z.literal('')),
  minPartsDurationPercent: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
  iCalUrl: z.string().url('Zadejte platnou URL').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

// ── Page ─────────────────────────────────────────────────────────────────────

export function TeamFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ICalImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<TeamMemberDto | null>(null)

  const { data: existingTeam, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: ageGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: seasons } = useQuery({ queryKey: ['seasons'], queryFn: seasonsApi.getAll })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', ageGroupId: 0, clubId: 0, seasonId: '', personsMin: '', personsMax: '', defaultTrainingDuration: '', maxTrainingDuration: '', maxTrainingPartDuration: '', minPartsDurationPercent: '', iCalUrl: '' },
  })

  const watchedClubId = watch('clubId')

  useEffect(() => {
    if (existingTeam) {
      reset({
        name: existingTeam.name,
        ageGroupId: existingTeam.ageGroupId ?? 0,
        clubId: existingTeam.clubId ?? 0,
        seasonId: existingTeam.seasonId ?? '',
        personsMin: existingTeam.personsMin ?? '',
        personsMax: existingTeam.personsMax ?? '',
        defaultTrainingDuration: existingTeam.defaultTrainingDuration ?? '',
        maxTrainingDuration: existingTeam.maxTrainingDuration ?? '',
        maxTrainingPartDuration: existingTeam.maxTrainingPartDuration ?? '',
        minPartsDurationPercent: existingTeam.minPartsDurationPercent ?? '',
        iCalUrl: existingTeam.iCalUrl ?? '',
      })
    }
  }, [existingTeam, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const ageGroup = ageGroups?.find((a) => a.id === Number(data.ageGroupId))
      const club = clubs?.find((c) => c.id === Number(data.clubId))

      const dto = {
        id: isEdit ? Number(id) : 0,
        name: data.name,
        ageGroupId: Number(data.ageGroupId),
        ageGroup: ageGroup ?? { id: Number(data.ageGroupId), name: '', description: '' },
        clubId: Number(data.clubId),
        club: club ?? { id: Number(data.clubId), name: '' },
        seasonId: data.seasonId !== '' ? Number(data.seasonId) : null,
        personsMin: data.personsMin !== '' ? Number(data.personsMin) : undefined,
        personsMax: data.personsMax !== '' ? Number(data.personsMax) : undefined,
        defaultTrainingDuration: data.defaultTrainingDuration !== '' ? Number(data.defaultTrainingDuration) : undefined,
        maxTrainingDuration: data.maxTrainingDuration !== '' ? Number(data.maxTrainingDuration) : undefined,
        maxTrainingPartDuration: data.maxTrainingPartDuration !== '' ? Number(data.maxTrainingPartDuration) : undefined,
        minPartsDurationPercent: data.minPartsDurationPercent !== '' ? Number(data.minPartsDurationPercent) : undefined,
        iCalUrl: data.iCalUrl || undefined,
        appointments: [],
        teamMembers: [],
      }

      return isEdit ? teamsApi.update(dto) : teamsApi.create(dto)
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['team', id] })
      } else {
        navigate('/teams')
      }
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data
      const msg = data?.errors?.join(', ') ?? data?.message ?? 'Uložení selhalo. Zkuste to prosím znovu.'
      setSaveError(msg)
    },
  })

  const importMutation = useMutation({
    mutationFn: () => teamsApi.importICal(Number(id)),
    onSuccess: (data) => {
      setImportResult(data)
      setImportError(null)
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setImportError(data?.message ?? 'Import selhal.')
      setImportResult(null)
    },
  })

  const addMembersMutation = useMutation({
    mutationFn: async (data: { members: MemberDto[]; isCoach: boolean; isPlayer: boolean }) => {
      for (const member of data.members) {
        // Only assign coach role if the member has a club coach role
        const memberIsCoach = data.isCoach && !!(member.hasClubRoleCoach || member.hasClubRoleMainCoach)
        await teamsApi.addMember(Number(id), {
          memberId: member.id,
          isCoach: memberIsCoach,
          isPlayer: data.isPlayer || !memberIsCoach, // ensure at least one role
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      setAddMemberOpen(false)
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => teamsApi.removeMember(Number(id), memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      setRemoveConfirm(null)
    },
  })

  if (isEdit && loadingTeam) return <LoadingSpinner />

  const teamMembers = existingTeam?.teamMembers ?? []

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Upravit tým' : 'Nový tým'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => { setSaveError(null); mutation.mutate(data) })} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-4">
            <Input
              label="Název týmu"
              placeholder="např. Junioři A"
              error={errors.name?.message}
              {...register('name')}
            />

            {/* AgeGroup */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Věková skupina</label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.ageGroupId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                {...register('ageGroupId')}
              >
                <option value={0}>— vyberte —</option>
                {ageGroups?.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
              {errors.ageGroupId && <p className="mt-1 text-xs text-red-500">{errors.ageGroupId.message}</p>}
            </div>

            {/* Club */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.clubId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                {...register('clubId')}
              >
                <option value={0}>— vyberte —</option>
                {clubs?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clubId && <p className="mt-1 text-xs text-red-500">{errors.clubId.message}</p>}
            </div>

            {/* Season */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sezóna</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                {...register('seasonId')}
              >
                <option value="">— bez sezóny —</option>
                {seasons?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Nastavení hráčů */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <p className="text-sm font-medium text-gray-700">Nastavení hráčů</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hráčů min."
                type="number"
                min={1}
                max={100}
                placeholder="např. 8"
                error={errors.personsMin?.message}
                {...register('personsMin')}
              />
              <Input
                label="Hráčů max."
                type="number"
                min={1}
                max={100}
                placeholder="např. 20"
                error={errors.personsMax?.message}
                {...register('personsMax')}
              />
            </div>
            <Input
              label="Výchozí délka tréninku (min)"
              type="number"
              min={1}
              max={240}
              placeholder="např. 90"
              error={errors.defaultTrainingDuration?.message}
              {...register('defaultTrainingDuration')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max. délka tréninku (min)"
                type="number"
                min={1}
                max={240}
                placeholder="např. 120"
                error={errors.maxTrainingDuration?.message}
                {...register('maxTrainingDuration')}
              />
              <Input
                label="Max. délka části (min)"
                type="number"
                min={1}
                max={120}
                placeholder="např. 40"
                error={errors.maxTrainingPartDuration?.message}
                {...register('maxTrainingPartDuration')}
              />
            </div>
            <Input
              label="Min. pokrytí částmi (%)"
              type="number"
              min={1}
              max={100}
              placeholder={`výchozí: 95`}
              error={errors.minPartsDurationPercent?.message}
              {...register('minPartsDurationPercent')}
            />
          </CardContent>
        </Card>

        {/* Členové týmu */}
        {isEdit && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Členové týmu ({teamMembers.length})
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddMemberOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />Přidat člena
                </Button>
              </div>

              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tým zatím nemá žádné členy.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Příjmení</th>
                        <th className="px-3 py-2 text-left">Jméno</th>
                        <th className="px-3 py-2 text-left">Ročník</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-right w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamMembers.map((tm) => (
                        <tr key={tm.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{tm.member?.lastName}</td>
                          <td className="px-3 py-2 text-gray-600">{tm.member?.firstName}</td>
                          <td className="px-3 py-2 text-gray-600">{tm.member?.birthYear || '–'}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {[tm.isCoach && 'Trenér', tm.isPlayer && 'Hráč'].filter(Boolean).join(', ')}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setRemoveConfirm(tm)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              title="Odebrat z týmu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kalendář (iCal) */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <p className="text-sm font-medium text-gray-700">Kalendář (iCal)</p>
            <Input
              label="URL kalendáře (iCal)"
              placeholder="https://example.com/calendar.ics"
              error={errors.iCalUrl?.message}
              {...register('iCalUrl')}
            />
            {isEdit && existingTeam?.iCalUrl && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setImportResult(null); setImportError(null); importMutation.mutate() }}
                  loading={importMutation.isPending}
                >
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Importovat události z kalendáře
                </Button>
                {importResult && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      Importováno: {importResult.imported}, aktualizováno: {importResult.updated}, přeskočeno: {importResult.skipped}
                      {importResult.errors.length > 0 && (
                        <span className="block text-orange-600 mt-1">{importResult.errors.join('; ')}</span>
                      )}
                    </span>
                  </div>
                )}
                {importError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/teams')}>
            Zrušit
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Uložit tým
          </Button>
        </div>
      </form>

      {/* Add member modal */}
      {isEdit && addMemberOpen && (
        <AddTeamMemberModal
          teamId={Number(id)}
          clubId={Number(watchedClubId) || existingTeam?.clubId}
          existingMemberIds={teamMembers.map((tm) => tm.memberId)}
          onAddMembers={(members, isCoach, isPlayer) => addMembersMutation.mutate({ members, isCoach, isPlayer })}
          adding={addMembersMutation.isPending}
          onClose={() => setAddMemberOpen(false)}
        />
      )}

      {/* Remove member confirm */}
      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Odebrat člena z týmu"
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Opravdu chcete odebrat <strong>{removeConfirm?.member?.firstName} {removeConfirm?.member?.lastName}</strong> z týmu?
          Člen nebude smazán, pouze odebrán z tohoto týmu.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRemoveConfirm(null)}>Zrušit</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => removeConfirm && removeMemberMutation.mutate(removeConfirm.memberId)}
            disabled={removeMemberMutation.isPending}
          >
            Odebrat
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Add Team Member Modal ─────────────────────────────────────────────────

function AddTeamMemberModal({
  clubId,
  existingMemberIds,
  onAddMembers,
  adding,
  onClose,
}: {
  teamId: number
  clubId?: number
  existingMemberIds: number[]
  onAddMembers: (members: MemberDto[], isCoach: boolean, isPlayer: boolean) => void
  adding: boolean
  onClose: () => void
}) {
  const { data: allMembers } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll })

  const [search, setSearch] = useState('')
  const [birthYearMin, setBirthYearMin] = useState('')
  const [birthYearMax, setBirthYearMax] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isCoach, setIsCoach] = useState(false)
  const [isPlayer, setIsPlayer] = useState(true)

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filter members: same club, not already in team, active, matching search & birth year range
  const availableMembers = useMemo(() => {
    if (!allMembers) return []
    return allMembers.filter((m) => {
      if (!m.isActive) return false
      if (clubId && m.clubId !== clubId) return false
      if (existingMemberIds.includes(m.id)) return false
      if (search) {
        const s = search.toLowerCase()
        if (!m.firstName.toLowerCase().includes(s) && !m.lastName.toLowerCase().includes(s) && !String(m.birthYear).includes(s)) return false
      }
      if (birthYearMin && m.birthYear < Number(birthYearMin)) return false
      if (birthYearMax && m.birthYear > Number(birthYearMax)) return false
      return true
    })
  }, [allMembers, clubId, existingMemberIds, search, birthYearMin, birthYearMax])

  const isMemberCoach = (m: MemberDto) => !!(m.hasClubRoleCoach || m.hasClubRoleMainCoach)

  // Selected members resolved from IDs
  const selectedMembers = useMemo(
    () => (allMembers ?? []).filter((m) => selectedIds.has(m.id)),
    [allMembers, selectedIds],
  )

  // Coach validation for selected members
  const selectedNonCoaches = isCoach ? selectedMembers.filter((m) => !isMemberCoach(m)) : []

  // For "select all" filtered
  const allFilteredSelected = availableMembers.length > 0 && availableMembers.every((m) => selectedIds.has(m.id))
  const someFilteredSelected = availableMembers.some((m) => selectedIds.has(m.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev)
        availableMembers.forEach((m) => next.delete(m.id))
        return next
      })
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev)
        availableMembers.forEach((m) => next.add(m.id))
        return next
      })
    }
  }

  const handleAdd = () => {
    if (selectedMembers.length === 0) return
    onAddMembers(selectedMembers, isCoach, isPlayer)
  }

  return (
    <Modal isOpen onClose={onClose} title="Přidat členy do týmu" maxWidth="md">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Hledat jméno, příjmení…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ročník od"
            type="number"
            placeholder="např. 2010"
            value={birthYearMin}
            onChange={(e) => setBirthYearMin(e.target.value)}
          />
          <Input
            label="Ročník do"
            type="number"
            placeholder="např. 2015"
            value={birthYearMax}
            onChange={(e) => setBirthYearMax(e.target.value)}
          />
        </div>

        {/* Role selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Role v týmu:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPlayer}
              onChange={(e) => setIsPlayer(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
            />
            <span className="text-sm text-gray-700">Hráč</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCoach}
              onChange={(e) => setIsCoach(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
            />
            <span className="text-sm text-gray-700">Trenér</span>
          </label>
        </div>
        {isCoach && (
          <p className="text-xs text-gray-500">
            Jako trenéra lze přidat pouze člena s klubovou rolí trenér nebo hlavní trenér.
          </p>
        )}

        {/* Members list */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          {availableMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Žádní dostupní členové.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Příjmení</th>
                  <th className="px-3 py-2 text-left">Jméno</th>
                  <th className="px-3 py-2 text-left">Ročník</th>
                  {isCoach && <th className="px-3 py-2 text-left">Klubová role</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableMembers.map((m) => {
                  const isSelected = selectedIds.has(m.id)
                  const canBeCoach = isMemberCoach(m)
                  return (
                    <tr
                      key={m.id}
                      onClick={() => toggleSelected(m.id)}
                      className={`cursor-pointer ${isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(m.id)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{m.lastName}</td>
                      <td className="px-3 py-2">{m.firstName}</td>
                      <td className="px-3 py-2">{m.birthYear}</td>
                      {isCoach && (
                        <td className="px-3 py-2 text-xs">
                          {canBeCoach ? (
                            <span className="text-green-600">{m.hasClubRoleMainCoach ? 'Hlavní trenér' : 'Trenér'}</span>
                          ) : (
                            <span className="text-red-400">–</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Warnings */}
        {isCoach && selectedNonCoaches.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              {selectedNonCoaches.length === 1
                ? <><strong>{selectedNonCoaches[0].firstName} {selectedNonCoaches[0].lastName}</strong> nemá klubovou roli trenéra — bude přidán/a pouze jako hráč.</>
                : <>{selectedNonCoaches.length} vybraných členů nemá klubovou roli trenéra — budou přidáni pouze jako hráči.</>
              }
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Vybráno: {selectedIds.size} z {availableMembers.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || (!isCoach && !isPlayer) || adding}
              onClick={handleAdd}
            >
              {adding ? 'Přidávání…' : `Přidat do týmu (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
