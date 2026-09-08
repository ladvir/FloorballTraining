import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'

type Sort = 'avg' | 'total' | 'challenges'
const SORTS: { key: Sort; label: StringKey }[] = [
  { key: 'avg', label: 'teamLeaderboard.sortAvg' },
  { key: 'total', label: 'teamLeaderboard.sortTotal' },
  { key: 'challenges', label: 'teamLeaderboard.sortChallenges' },
]

// Team-vs-team leaderboard within the caller's club (#156). Collapsible; fetches only when opened so it
// doesn't add a request to every RosterScreen mount.
export function TeamLeaderboardCard() {
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState<Sort>('avg')

  const { data } = useQuery({
    queryKey: ['team-leaderboard', sort],
    queryFn: () => xpApi.getTeamLeaderboard({ sort }),
    enabled: open,
  })
  const rows = data?.rows ?? []

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setOpen((o) => !o)}>
        <Icon name="people" size={16} color={colors.accent} />
        <Text style={styles.title}>{t('teamLeaderboard.title')}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>

      {open && (
        <>
          <View style={styles.toggle}>
            {SORTS.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={[styles.toggleItem, sort === s.key && styles.toggleItemActive]}
              >
                <Text style={[styles.toggleText, sort === s.key && styles.toggleTextActive]}>
                  {t(s.label)}
                </Text>
              </Pressable>
            ))}
          </View>

          {rows.length === 0 ? (
            <Text style={styles.empty}>{t('teamLeaderboard.empty')}</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tr, styles.head]}>
                <Text style={[styles.cell, styles.pos]}>#</Text>
                <Text style={[styles.cell, styles.team]}>{t('teamLeaderboard.team')}</Text>
                <Text style={[styles.cell, styles.num]}>{t('teamLeaderboard.avg')}</Text>
                <Text style={[styles.cell, styles.num]}>{t('teamLeaderboard.total')}</Text>
                <Text style={[styles.cell, styles.num]}>{t('teamLeaderboard.challenges')}</Text>
              </View>
              {rows.map((r) => (
                <View key={r.teamId} style={styles.tr}>
                  <Text style={[styles.cell, styles.pos]}>{r.position}</Text>
                  <Text style={[styles.cell, styles.team]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={[styles.cell, styles.num, styles.strong]}>{r.avgXp}</Text>
                  <Text style={[styles.cell, styles.num]}>{r.seasonXp}</Text>
                  <Text style={[styles.cell, styles.num]}>{r.challengesCompleted}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.sm,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1, color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '700' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.pill,
    padding: 2,
  },
  toggleItem: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: radius.pill },
  toggleItemActive: { backgroundColor: colors.accent },
  toggleText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  toggleTextActive: { color: colors.textPrimary },
  empty: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    paddingVertical: spacing.xs,
  },
  table: { gap: 2 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
  },
  head: { borderTopWidth: 0 },
  cell: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  pos: { width: 22, color: colors.textMuted },
  team: { flex: 1, color: colors.textPrimary, fontWeight: '600' },
  num: { width: 52, textAlign: 'right' },
  strong: { color: colors.textPrimary, fontWeight: '700' },
})
