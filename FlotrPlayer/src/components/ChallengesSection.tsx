import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import type { ChallengeDto } from '../types/domain.types'
import { colors, glass, gradeColors, radius, spacing, typography } from '../theme/tokens'

const DONE_COLOR = gradeColors[1] // green

// "Tvoje výzvy" (#109) — self-completable challenges surfaced on the home card at login. Progress is
// derived from coach-entered records (attendance/goals/…), so the player never self-reports here — they
// just watch it fill and get a celebratory row when a challenge completes. Cache key shared with the app;
// refetches after a recompute writes new progress. Loading/error → nothing (the card stays functional).
// ponytail: always celebrates current-window completions; no per-player "seen once" tracking (would need
//   local persisted state). Add AsyncStorage-backed lastSeen if the repeated celebration gets noisy.
export function ChallengesSection({ memberId }: { memberId: number }) {
  const { data } = useQuery({
    queryKey: ['xp', 'challenges', memberId],
    queryFn: () => xpApi.getChallenges(memberId),
  })
  if (!data || data.active.length === 0) return null

  // Completed first (celebrate), then most progress — keeps the win at the top after a recompute.
  const rows = [...data.active].sort(
    (a, b) => Number(b.completed) - Number(a.completed) || b.progress - a.progress,
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="flag" size={16} color={colors.accent} />
        <Text style={styles.title}>{t('challenge.section')}</Text>
      </View>
      {rows.map((c) => (
        <ChallengeRow key={c.code} c={c} />
      ))}
    </View>
  )
}

function ChallengeRow({ c }: { c: ChallengeDto }) {
  const titleKey = `challenge.${c.code}.title` as StringKey
  const descKey = `challenge.${c.code}.desc` as StringKey
  const windowKey = `challenge.window.${c.window}` as StringKey
  const fillPct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100)

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>{t(titleKey)}</Text>
        {c.completed ? (
          <View style={styles.doneChip}>
            <Icon name="checkmark-circle" size={14} color={DONE_COLOR} />
            <Text style={styles.doneText}>{t('challenge.done', { xp: String(c.rewardXp) })}</Text>
          </View>
        ) : (
          <Text style={styles.reward}>{t('challenge.rewardXp', { xp: String(c.rewardXp) })}</Text>
        )}
      </View>
      <Text style={styles.rowDesc}>{t(descKey)}</Text>

      <View style={styles.track}>
        {fillPct > 0 && (
          <View style={[styles.fill, { width: `${fillPct}%`, backgroundColor: c.completed ? DONE_COLOR : colors.accent }]} />
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.window}>{t(windowKey)}</Text>
        <Text style={styles.count}>{t('challenge.progress', { current: String(c.current), target: String(c.target) })}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360, // align with PlayerSkillCard's capped width
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
  row: {
    gap: 4,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  rowTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize + 2,
    fontWeight: '600',
  },
  reward: {
    color: gradeColors[4],
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '800',
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  doneText: {
    color: DONE_COLOR,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  rowDesc: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  window: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '600',
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize - 1,
  },
})
