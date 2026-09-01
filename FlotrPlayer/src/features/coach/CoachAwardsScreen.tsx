import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi, xpApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import type { AwardType, XpAwardDto } from '../../types/domain.types'

const STAR_COLOR = '#FBBF24'

interface CoachAwardsParams {
  appointmentId: number
  /** Event name, for the screen subtitle. */
  title: string
  /** Match events also expose the "family cheered" bonus, mirrors FloTr web. */
  isMatch: boolean
}

type AwardAction = { kind: 'toggle'; type: 'FairPlay' | 'FamilyCheered' } | { kind: 'pot' }

/** Pure next-state for one event's awards list — mirrors FloTr web's reduceAwards. PlayerOfTraining
 * is 1-per-event, so setting it for one member clears it from whoever held it. */
function reduceLocalAward(
  list: XpAwardDto[],
  action: AwardAction,
  memberId: number,
  appointmentId: number,
): XpAwardDto[] {
  const temp = (type: AwardType): XpAwardDto => ({
    id: -Date.now(),
    appointmentId,
    memberId,
    type,
    awardedByUserId: '',
    awardedAt: '',
  })
  if (action.kind === 'toggle') {
    const ex = list.find((a) => a.memberId === memberId && a.type === action.type)
    return ex ? list.filter((a) => a !== ex) : [...list, temp(action.type)]
  }
  const mine = list.find((a) => a.memberId === memberId && a.type === 'PlayerOfTraining')
  if (mine) return list.filter((a) => a !== mine)
  return [...list.filter((a) => a.type !== 'PlayerOfTraining'), temp('PlayerOfTraining')]
}

// Coach 1-click bonuses (#100/#110), moved off every player's card to a single per-event screen
// (feedback: pick the event, then pick the player — don't repeat this under each player). Reached
// from a team event's "Trenérské bonusy" button on EventsScreen; coach-only route.
export function CoachAwardsScreen() {
  const navigation = useNavigation()
  const { appointmentId, title, isMatch } = useRoute().params as CoachAwardsParams
  const queryClient = useQueryClient()

  const rosterQuery = useQuery({ queryKey: ['playerskills', 'roster'], queryFn: playerSkillsApi.getRoster })

  const awardsKey = ['xp', 'awards', appointmentId]
  // serverRef mirrors the last *server* response (never the optimistic cache) so a mutation always
  // decides create/delete from real ids — same reasoning as the web AttendanceModal.
  const serverRef = useRef<XpAwardDto[]>([])
  const { data: awards = [] } = useQuery({
    queryKey: awardsKey,
    queryFn: async () => {
      const d = await xpApi.listAwards(appointmentId)
      serverRef.current = d
      return d
    },
  })

  const awardMutation = useMutation({
    mutationFn: async ({ memberId, action }: { memberId: number; action: AwardAction }) => {
      const server = serverRef.current
      if (action.kind === 'toggle') {
        const ex = server.find((a) => a.memberId === memberId && a.type === action.type)
        if (ex) await xpApi.deleteAward(ex.id)
        else await xpApi.createAward({ appointmentId, memberId, type: action.type })
        return
      }
      const mine = server.find((a) => a.memberId === memberId && a.type === 'PlayerOfTraining')
      if (mine) {
        await xpApi.deleteAward(mine.id)
        return
      }
      const other = server.find((a) => a.type === 'PlayerOfTraining')
      if (other) await xpApi.deleteAward(other.id) // 1/event index → free the slot first
      await xpApi.createAward({ appointmentId, memberId, type: 'PlayerOfTraining' })
    },
    // ponytail: optimistic cache patch; rapid conflicting taps self-heal on the onSettled refetch
    // (the unique index is the real guardrail, same tradeoff as FloTr web's AttendanceModal).
    onMutate: async ({ memberId, action }) => {
      await queryClient.cancelQueries({ queryKey: awardsKey })
      const prev = queryClient.getQueryData<XpAwardDto[]>(awardsKey)
      queryClient.setQueryData<XpAwardDto[]>(awardsKey, (old = []) =>
        reduceLocalAward(old, action, memberId, appointmentId),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(awardsKey, ctx?.prev),
    onSuccess: (_d, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['xp', memberId] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: awardsKey }),
  })

  const players = [...(rosterQuery.data ?? [])].sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs'))
  const hasAward = (memberId: number, type: AwardType) =>
    awards.some((a) => a.memberId === memberId && a.type === type)

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('coachAwards.title')}</Text>
        <Text style={styles.subtitle}>{title}</Text>

        {rosterQuery.isLoading ? (
          <LoadingState inline />
        ) : rosterQuery.isError ? (
          <ErrorState
            inline
            message={t('roster.cardLoadError')}
            onRetry={() => rosterQuery.refetch()}
            retrying={rosterQuery.isRefetching}
          />
        ) : players.length === 0 ? (
          <EmptyState message={t('coachAwards.noPlayers')} />
        ) : (
          players.map((p) => (
            <GlassCard key={p.memberId} style={styles.row}>
              <Text style={styles.playerName}>
                {p.lastName} {p.firstName}
              </Text>
              {p.teams.length > 0 && <Text style={styles.playerTeams}>{p.teams.join(', ')}</Text>}
              <View style={styles.pillRow}>
                <AwardPill
                  active={hasAward(p.memberId, 'PlayerOfTraining')}
                  icon="star"
                  labelKey="xpHowto.name.PlayerOfTraining"
                  onPress={() => awardMutation.mutate({ memberId: p.memberId, action: { kind: 'pot' } })}
                />
                <AwardPill
                  active={hasAward(p.memberId, 'FairPlay')}
                  icon="thumbs-up"
                  labelKey="xpHowto.name.FairPlay"
                  onPress={() =>
                    awardMutation.mutate({ memberId: p.memberId, action: { kind: 'toggle', type: 'FairPlay' } })
                  }
                />
                {isMatch && (
                  <AwardPill
                    active={hasAward(p.memberId, 'FamilyCheered')}
                    icon="megaphone"
                    labelKey="xpHowto.name.FamilyCheered"
                    onPress={() =>
                      awardMutation.mutate({
                        memberId: p.memberId,
                        action: { kind: 'toggle', type: 'FamilyCheered' },
                      })
                    }
                  />
                )}
              </View>
            </GlassCard>
          ))
        )}

        {awardMutation.isError && <Text style={styles.error}>{t('coachAwards.saveError')}</Text>}
      </ScrollView>
    </Screen>
  )
}

function AwardPill({
  active,
  icon,
  labelKey,
  onPress,
}: {
  active: boolean
  icon: 'star' | 'thumbs-up' | 'megaphone'
  labelKey: StringKey
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Icon
        name={active ? icon : (`${icon}-outline` as const)}
        size={14}
        color={active ? STAR_COLOR : colors.textSecondary}
      />
      <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
        {t(labelKey)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.accent,
    fontSize: typography.body.fontSize - 1,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 1,
    marginBottom: spacing.sm,
  },
  row: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  playerTeams: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginTop: -2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  pillActive: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: STAR_COLOR,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  pillTextActive: {
    color: STAR_COLOR,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
  },
})
