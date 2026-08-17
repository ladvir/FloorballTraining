import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { LoadingState } from './StatusView'
import { appointmentsApi, xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import type { AppointmentDto, AwardType, XpAwardDto } from '../types/domain.types'

const STAR_COLOR = '#FBBF24'
const MATCH_TYPE = 3 // AppointmentType.Match — gates the "family cheered" bonus, mirrors FloTr web

type AwardAction = { kind: 'toggle'; type: 'FairPlay' | 'FamilyCheered' } | { kind: 'pot' }

/** Pure next-state for one appointment's awards list — mirrors FloTr web's reduceAwards. */
function reduceLocalAward(list: XpAwardDto[], action: AwardAction, memberId: number, appointmentId: number): XpAwardDto[] {
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

const pad = (n: number) => String(n).padStart(2, '0')
const formatWhen = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const eventTitle = (a: AppointmentDto) =>
  a.name || a.trainingName || t(a.appointmentType === MATCH_TYPE ? 'events.typeMatch' : 'events.typeTraining')

// Coach's mobile counterpart to FloTr web's AttendanceModal bonus pills (#101), for the coach who
// only has a phone at the training/match (#110). Placed on the player's card in coach mode (#88's
// recommended "variant 1") instead of a new event/roster screen, since FlotrPlayer coaches already
// land there per player. Reuses GET /appointments (already scoped to the coach's accessible teams)
// as the event picker's source instead of adding a team filter server-side.
export function CoachAwardsSection({ memberId }: { memberId: number }) {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const eventsQuery = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: appointmentsApi.getUpcoming })
  const events = useMemo(() => (eventsQuery.data ?? []).filter((a) => a.teamId != null), [eventsQuery.data])
  const appointmentId = selectedId ?? events[0]?.id ?? null
  const event = events.find((a) => a.id === appointmentId)
  const isMatch = event?.appointmentType === MATCH_TYPE

  const awardsKey = ['xp', 'awards', appointmentId]
  // serverRef mirrors the last *server* response (never the optimistic cache) so a mutation always
  // decides create/delete from real ids, same reasoning as the web AttendanceModal.
  const serverRef = useRef<XpAwardDto[]>([])

  const { data: awards = [] } = useQuery({
    queryKey: awardsKey,
    queryFn: async () => {
      const d = await xpApi.listAwards(appointmentId!)
      serverRef.current = d
      return d
    },
    enabled: appointmentId != null,
  })

  const awardMutation = useMutation({
    mutationFn: async (action: AwardAction) => {
      const server = serverRef.current
      if (action.kind === 'toggle') {
        const ex = server.find((a) => a.memberId === memberId && a.type === action.type)
        if (ex) await xpApi.deleteAward(ex.id)
        else await xpApi.createAward({ appointmentId: appointmentId!, memberId, type: action.type })
        return
      }
      const mine = server.find((a) => a.memberId === memberId && a.type === 'PlayerOfTraining')
      if (mine) {
        await xpApi.deleteAward(mine.id)
        return
      }
      const other = server.find((a) => a.type === 'PlayerOfTraining')
      if (other) await xpApi.deleteAward(other.id) // 1/event index → free the slot first
      await xpApi.createAward({ appointmentId: appointmentId!, memberId, type: 'PlayerOfTraining' })
    },
    // ponytail: optimistic cache patch; rapid conflicting taps self-heal on the onSettled refetch
    // (same tradeoff as FloTr web's AttendanceModal — the unique index is the actual guardrail).
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: awardsKey })
      const prev = queryClient.getQueryData<XpAwardDto[]>(awardsKey)
      queryClient.setQueryData<XpAwardDto[]>(awardsKey, (old = []) =>
        reduceLocalAward(old, action, memberId, appointmentId!),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(awardsKey, ctx?.prev),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp', memberId] }) // player's XP card
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: awardsKey }),
  })

  const hasAward = (type: AwardType) => awards.some((a) => a.memberId === memberId && a.type === type)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="trophy-outline" size={16} color={colors.accent} />
        <Text style={styles.title}>{t('coachAwards.title')}</Text>
      </View>

      {eventsQuery.isLoading ? (
        <LoadingState inline />
      ) : events.length === 0 ? (
        <Text style={styles.empty}>{t('coachAwards.noEvents')}</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRow}>
            {events.map((a) => {
              const active = a.id === appointmentId
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedId(a.id)}
                  style={[styles.eventChip, active && styles.eventChipActive]}
                >
                  <Text style={[styles.eventChipTitle, active && styles.eventChipTextActive]} numberOfLines={1}>
                    {eventTitle(a)}
                  </Text>
                  <Text style={[styles.eventChipMeta, active && styles.eventChipTextActive]}>{formatWhen(a.start)}</Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.pillRow}>
            <AwardPill
              active={hasAward('PlayerOfTraining')}
              icon="star"
              labelKey="xpHowto.name.PlayerOfTraining"
              onPress={() => awardMutation.mutate({ kind: 'pot' })}
            />
            <AwardPill
              active={hasAward('FairPlay')}
              icon="thumbs-up"
              labelKey="xpHowto.name.FairPlay"
              onPress={() => awardMutation.mutate({ kind: 'toggle', type: 'FairPlay' })}
            />
            {isMatch && (
              <AwardPill
                active={hasAward('FamilyCheered')}
                icon="megaphone"
                labelKey="xpHowto.name.FamilyCheered"
                onPress={() => awardMutation.mutate({ kind: 'toggle', type: 'FamilyCheered' })}
              />
            )}
          </View>

          {awardMutation.isError && <Text style={styles.error}>{t('coachAwards.saveError')}</Text>}
        </>
      )}
    </View>
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
      <Icon name={active ? icon : (`${icon}-outline` as const)} size={14} color={active ? STAR_COLOR : colors.textSecondary} />
      <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
        {t(labelKey)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize + 1,
  },
  eventRow: {
    gap: spacing.sm,
  },
  eventChip: {
    minWidth: 92,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.sm + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
  },
  eventChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  eventChipTitle: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  eventChipMeta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize - 1,
    marginTop: 1,
  },
  eventChipTextActive: {
    color: colors.accent,
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
