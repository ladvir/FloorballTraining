import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { membersApi, teamsApi } from '../../api/index'
import { PlayerTestResults } from './PlayerTestResults'

export function PlayerTestProfilePage() {
  const { t } = useTranslation()
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('teamId') ? Number(searchParams.get('teamId')) : null

  const { data: member } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersApi.getById(Number(memberId)),
  })

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId!),
    enabled: teamId != null && teamId > 0,
  })

  const memberName = member
    ? `${member.firstName} ${member.lastName}`
    : t('testing.playerFallback', { id: memberId })

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('testing.testProfileTitle', { name: memberName })}
        description={
          [
            member?.birthYear ? t('testing.birthYearLabel', { year: member.birthYear }) : '',
            team ? t('testing.teamNameLabel', { name: team.name }) : '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </Button>
        }
      />

      <PlayerTestResults memberId={Number(memberId)} teamId={teamId} />
    </div>
  )
}
