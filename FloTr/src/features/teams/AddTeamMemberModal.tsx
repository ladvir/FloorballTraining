import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { membersApi } from '../../api/index'
import { formatFullName } from '../../utils/name'
import type { MemberDto } from '../../types/domain.types'

/** Pick club members to add to a team (as players and/or coaches). Shared by the team page + create form. */
export function AddTeamMemberModal({
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
  const { t } = useTranslation()
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
        if (
          !m.firstName.toLowerCase().includes(s) &&
          !m.lastName.toLowerCase().includes(s) &&
          !String(m.birthYear).includes(s)
        )
          return false
      }
      if (birthYearMin && m.birthYear < Number(birthYearMin)) return false
      if (birthYearMax && m.birthYear > Number(birthYearMax)) return false
      return true
    })
  }, [allMembers, clubId, existingMemberIds, search, birthYearMin, birthYearMax])

  const isMemberCoach = (m: MemberDto) =>
    !!(m.hasClubRoleCoach || m.hasClubRoleMainCoach || m.hasClubRoleClubAdmin)

  const selectedMembers = useMemo(
    () => (allMembers ?? []).filter((m) => selectedIds.has(m.id)),
    [allMembers, selectedIds]
  )

  const selectedNonCoaches = isCoach ? selectedMembers.filter((m) => !isMemberCoach(m)) : []

  const allFilteredSelected =
    availableMembers.length > 0 && availableMembers.every((m) => selectedIds.has(m.id))
  const someFilteredSelected = availableMembers.some((m) => selectedIds.has(m.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        availableMembers.forEach((m) => next.delete(m.id))
        return next
      })
    } else {
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
    <Modal isOpen onClose={onClose} title={t('teams.addMember')} maxWidth="md">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('members.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('teams.birthYearFrom')}
            type="number"
            placeholder={t('activities.egValue', { n: 2010 })}
            value={birthYearMin}
            onChange={(e) => setBirthYearMin(e.target.value)}
          />
          <Input
            label={t('teams.birthYearTo')}
            type="number"
            placeholder={t('activities.egValue', { n: 2015 })}
            value={birthYearMax}
            onChange={(e) => setBirthYearMax(e.target.value)}
          />
        </div>

        {/* Role selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">{t('teams.roleInTeam')}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPlayer}
              onChange={(e) => setIsPlayer(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
            />
            <span className="text-sm text-gray-700">{t('common.player')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCoach}
              onChange={(e) => setIsCoach(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
            />
            <span className="text-sm text-gray-700">{t('common.coach')}</span>
          </label>
        </div>
        {isCoach && <p className="text-xs text-gray-500">{t('teams.coachRoleNote')}</p>}

        {/* Members list */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          {availableMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('teams.noMembers')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">{t('members.formLastName')}</th>
                  <th className="px-3 py-2 text-left">{t('members.formFirstName')}</th>
                  <th className="px-3 py-2 text-left">{t('teams.colBirthYear')}</th>
                  {isCoach && <th className="px-3 py-2 text-left">{t('teams.clubRole')}</th>}
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
                            <span className="text-green-600">
                              {m.hasClubRoleClubAdmin
                                ? t('members.roleClubAdmin')
                                : m.hasClubRoleMainCoach
                                  ? t('members.roleMainCoach')
                                  : t('members.roleCoach')}
                            </span>
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
              {selectedNonCoaches.length === 1 ? (
                <>
                  <strong>
                    {formatFullName(
                      selectedNonCoaches[0].firstName,
                      selectedNonCoaches[0].lastName
                    )}
                  </strong>{' '}
                  {t('teams.nonCoachWarning')}
                </>
              ) : (
                <>
                  {selectedNonCoaches.length} {t('teams.nonCoachWarningDesc')}
                </>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {t('teams.selectedOf', { selected: selectedIds.size, total: availableMembers.length })}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || (!isCoach && !isPlayer) || adding}
              onClick={handleAdd}
            >
              {adding ? t('common.loading') : `${t('teams.addMember')} (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
