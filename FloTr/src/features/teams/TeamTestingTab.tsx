import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TeamResultsMatrix } from '../testing/TeamResultsMatrix'
import { PlayerTestResults } from '../testing/PlayerTestResults'
import { formatFullName } from '../../utils/name'
import type { TeamMemberDto } from '../../types/domain.types'

/** Test results for the team detail "Testování" tab: all-players matrix or a single player. */
export function TeamTestingTab({ teamId, players }: { teamId: number; players: TeamMemberDto[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<'all' | 'single'>('all')
  const [selectedMemberId, setSelectedMemberId] = useState(0)
  const memberId = selectedMemberId || players[0]?.memberId || 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setView('all')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              view === 'all' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('teams.allPlayers')}
          </button>
          <button
            type="button"
            onClick={() => setView('single')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              view === 'single' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('teams.onePlayer')}
          </button>
        </div>
        <Button size="sm" onClick={() => navigate(`/testing/team/${teamId}`)}>
          <ClipboardCheck className="h-4 w-4" />
          {t('testing.recordResults')}
        </Button>
      </div>

      {view === 'all' ? (
        <TeamResultsMatrix teamId={teamId} />
      ) : players.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t('teams.noPlayers')}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1 sm:max-w-xs">
            <label className="text-sm font-medium text-gray-700">{t('common.player')}</label>
            <select
              value={memberId}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              {players.map((tm) => (
                <option key={tm.memberId} value={tm.memberId}>
                  {tm.member
                    ? formatFullName(tm.member.firstName, tm.member.lastName)
                    : t('teams.playerFallback', { id: tm.memberId })}
                </option>
              ))}
            </select>
          </div>
          {memberId > 0 && <PlayerTestResults memberId={memberId} teamId={teamId} />}
        </>
      )}
    </div>
  )
}
