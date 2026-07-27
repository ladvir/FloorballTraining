import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi, xpApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import type { LeaderboardRowDto } from '../../types/domain.types'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'

const MEDALS = ['🥇', '🥈', '🥉']
const STAR_COLOR = '#FBBF24'
type Sort = 'season' | 'career'

// Klubový žebříček (#98, Etapa 2 gamifikace). API scopuje na klub volajícího automaticky.
// Výchozí řazení sezónní (férové — mladší/noví hráči nejsou zavaleni lifetime XP), přepínač na kariérní.
// „Hráč měsíce" (nejvíc XP za 30 dní) se zvýrazní nahoře. Vlastní řádek je označen „Ty".
export function LeaderboardScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const accountType = useAuthStore((s) => s.accountType)
  const [sort, setSort] = useState<Sort>('season')

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', sort],
    queryFn: () => xpApi.getLeaderboard({ sort }),
  })

  // Own memberId to highlight our row — reuses the card query cached by the other Player tabs.
  const { data: myCard } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
    enabled: accountType === 'Player',
  })
  const myId = myCard?.memberId

  if (isLoading) return <Screen><LoadingState /></Screen>
  if (isError || !data) {
    return <Screen><ErrorState message={t('leaderboard.title')} onRetry={() => refetch()} retrying={isRefetching} /></Screen>
  }

  const potm = data.playerOfMonth

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('leaderboard.title')}</Text>
        <View style={styles.toggle}>
          {(['season', 'career'] as Sort[]).map((s) => (
            <Pressable key={s} onPress={() => setSort(s)} style={[styles.toggleItem, sort === s && styles.toggleItemActive]}>
              <Text style={[styles.toggleText, sort === s && styles.toggleTextActive]}>
                {t(s === 'season' ? 'leaderboard.sortSeason' : 'leaderboard.sortCareer')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {potm && (
        <GlassCard style={styles.potm}>
          <Icon name="trophy" size={22} color={STAR_COLOR} />
          <View style={styles.potmText}>
            <Text style={styles.potmLabel}>{t('leaderboard.playerOfMonth')}</Text>
            <Text style={styles.potmName}>{potm.name}</Text>
          </View>
          <Text style={styles.potmXp}>{t('leaderboard.recentXp', { xp: String(potm.recentXp) })}</Text>
        </GlassCard>
      )}

      <FlatList
        data={data.rows}
        keyExtractor={(r) => String(r.memberId)}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.xxl }]}
        ListEmptyComponent={<EmptyState message={t('leaderboard.empty')} />}
        renderItem={({ item }) => <Row row={item} sort={sort} isMe={item.memberId === myId} />}
      />
    </Screen>
  )
}

function Row({ row, sort, isMe }: { row: LeaderboardRowDto; sort: Sort; isMe: boolean }) {
  const medal = row.position <= 3 ? MEDALS[row.position - 1] : null
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rank}>
        {medal ? <Text style={styles.medal}>{medal}</Text> : <Text style={styles.rankNum}>{row.position}</Text>}
      </View>
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
        {isMe && <Text style={styles.youChip}>{t('leaderboard.you')}</Text>}
      </View>
      {sort === 'season' ? (
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{t('leaderboard.seasonXp', { xp: String(row.seasonXp) })}</Text>
          <View style={styles.starRow}>
            <Icon name="star" size={12} color={STAR_COLOR} />
            <Text style={styles.metricSub}>{row.stars}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{t('leaderboard.lifetimeXp', { xp: String(row.lifetimeXp) })}</Text>
          <Text style={styles.metricSub}>{t(`xp.rank${Math.min(6, Math.max(0, row.careerRankIndex))}` as StringKey)}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  toggleItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  toggleItemActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.textSecondary, fontSize: typography.caption.fontSize + 1, fontWeight: '600' },
  toggleTextActive: { color: colors.textPrimary },
  potm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  potmText: { flex: 1 },
  potmLabel: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  potmName: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '700' },
  potmXp: { color: STAR_COLOR, fontSize: typography.caption.fontSize + 1, fontWeight: '700' },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowMe: { borderColor: colors.accent },
  rank: { width: 28, alignItems: 'center' },
  medal: { fontSize: 18 },
  rankNum: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '700' },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.textPrimary, fontSize: typography.body.fontSize - 1, fontWeight: '600', flexShrink: 1 },
  youChip: {
    color: colors.accent,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  metric: { alignItems: 'flex-end' },
  metricValue: { color: colors.textPrimary, fontSize: typography.body.fontSize - 1, fontWeight: '700' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metricSub: { color: colors.textMuted, fontSize: typography.caption.fontSize },
})
