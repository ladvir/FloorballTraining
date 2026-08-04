import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { HomeTrainingConfirmations } from '../guardian/HomeTrainingConfirmations'
import { fanApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, gradeColors, spacing, typography } from '../../theme/tokens'
import { formatDateTime } from '../../utils/date'
import { formatFullName } from '../../utils/name'
import type { FanChildDto, FanMatchDto } from '../../types/domain.types'

// Fan check-in (#103): a guardian's own children, each with their upcoming/current matches and a
// 1-click "Fandím" button that's only active in the match's time window. Shows the family's Fan XP
// and cheer-streak per child. Guardian-only surface (see MainTabs) - a check-in gives the child a
// "family cheered" bonus and grows the family's Fan XP.
export function FanScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0
  const queryClient = useQueryClient()
  const { data: children, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['fan', 'children'],
    queryFn: fanApi.getChildren,
  })

  const checkIn = useMutation({
    mutationFn: fanApi.checkIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fan', 'children'] }),
    onError: () => Alert.alert(t('fan.checkInError')),
  })

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    )
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={t('fan.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (tabBarHeight || spacing.xl) + spacing.xl }]}
      >
        <Text style={styles.title}>{t('fan.title')}</Text>
        {/* Home-training XP counter-sign — same page as cheering (#104) */}
        <HomeTrainingConfirmations />
        {!children?.length ? (
          <EmptyState message={t('children.empty')} />
        ) : (
          children.map((child) => (
            <ChildCard
              key={child.memberId}
              child={child}
              onCheckIn={(appointmentId) => checkIn.mutate({ appointmentId, memberId: child.memberId })}
              pending={checkIn.isPending}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

function ChildCard({
  child,
  onCheckIn,
  pending,
}: {
  child: FanChildDto
  onCheckIn: (appointmentId: number) => void
  pending: boolean
}) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.childName}>{formatFullName(child.firstName, child.lastName)}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Icon name="megaphone" size={13} color={colors.accent} />
          <Text style={styles.statText}>{t('fan.familyXp', { xp: String(child.familyXp) })}</Text>
        </View>
        {child.cheerStreak > 0 && (
          <View style={styles.stat}>
            <Icon name="flame" size={13} color={gradeColors[4]} />
            <Text style={styles.statText}>{t('fan.streak', { streak: String(child.cheerStreak) })}</Text>
          </View>
        )}
      </View>

      {child.matches.length === 0 ? (
        <Text style={styles.noMatches}>{t('fan.empty')}</Text>
      ) : (
        child.matches.map((m) => (
          <MatchRow key={m.appointmentId} match={m} onCheckIn={() => onCheckIn(m.appointmentId)} pending={pending} />
        ))
      )}
    </GlassCard>
  )
}

function MatchRow({ match, onCheckIn, pending }: { match: FanMatchDto; onCheckIn: () => void; pending: boolean }) {
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchInfo}>
        <Text style={styles.matchName} numberOfLines={1}>
          {match.name || t('fan.matchFallback')}
        </Text>
        <Text style={styles.matchTime}>{formatDateTime(match.start)}</Text>
      </View>
      {match.checkedIn ? (
        <View style={styles.cheeredPill}>
          <Icon name="checkmark-circle" size={16} color={gradeColors[1]} />
          <Text style={styles.cheeredText}>{t('fan.checkedIn')}</Text>
        </View>
      ) : (
        <View style={styles.buttonWrap}>
          <Button title={t('fan.checkIn')} onPress={onCheckIn} disabled={!match.canCheckIn} loading={pending} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  childName: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize - 2,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  noMatches: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize + 1,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.textMuted,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  matchTime: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  buttonWrap: {
    minWidth: 108,
  },
  cheeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cheeredText: {
    color: gradeColors[1],
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
})
