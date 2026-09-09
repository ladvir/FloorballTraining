import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import { colors, glass, gradeColors, layout, radius, spacing, typography } from '../theme/tokens'
import type { TeamChallengeDto } from '../types/domain.types'

const DONE_COLOR = gradeColors[1] // green

// Read-only team-challenge board (#156) for a player/guardian - mirrors ChallengesSection. Progress is
// derived server-side from the same coach-entered records as XP, so the player just watches it fill.
// Loading/error/empty -> renders nothing (the screen stays functional).
export function TeamChallengesSection({ teamId, teamName }: { teamId: number; teamName?: string }) {
  const { data } = useQuery({
    queryKey: ['team-challenges', 'team', teamId],
    queryFn: () => xpApi.getTeamChallenges(teamId),
  })
  const rows = data?.challenges ?? []
  if (rows.length === 0) return null

  const sorted = [...rows].sort(
    (a, b) => Number(b.completed) - Number(a.completed) || b.progress - a.progress,
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="flag" size={16} color={colors.accent} />
        <Text style={styles.title}>
          {t('teamChallenge.section')}
          {teamName ? ` · ${teamName}` : ''}
        </Text>
      </View>
      {sorted.map((c) => (
        <ChallengeRow key={c.id} c={c} />
      ))}
    </View>
  )
}

function ChallengeRow({ c }: { c: TeamChallengeDto }) {
  const fillPct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100)
  const windowKey = `teamChallenge.window.${c.window}` as StringKey

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>{c.name}</Text>
        {c.completed ? (
          <View style={styles.doneChip}>
            <Icon name="checkmark-circle" size={14} color={DONE_COLOR} />
            <Text style={styles.doneText}>{t('challenge.done', { xp: String(c.rewardXp) })}</Text>
          </View>
        ) : (
          <Text style={styles.reward}>{t('challenge.rewardXp', { xp: String(c.rewardXp) })}</Text>
        )}
      </View>
      {!!c.description && <Text style={styles.rowDesc}>{c.description}</Text>}

      {!c.isManual && (
        <>
          <View style={styles.track}>
            {fillPct > 0 && (
              <View
                style={[
                  styles.fill,
                  { width: `${fillPct}%`, backgroundColor: c.completed ? DONE_COLOR : colors.accent },
                ]}
              />
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.window}>{t(windowKey)}</Text>
            <Text style={styles.count}>
              {t('challenge.progress', { current: String(c.current), target: String(c.target) })}
            </Text>
          </View>
        </>
      )}
      {c.isManual && (
        <Text style={styles.window}>
          {c.completed
            ? t('challenge.done', { xp: String(c.rewardXp) })
            : t('teamChallenge.inProgress')}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '700' },
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
  reward: { color: gradeColors[4], fontSize: typography.caption.fontSize + 1, fontWeight: '800' },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  doneText: { color: DONE_COLOR, fontSize: typography.caption.fontSize, fontWeight: '700' },
  rowDesc: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: { height: '100%', borderRadius: radius.pill },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  window: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '600',
  },
  count: { color: colors.textMuted, fontSize: typography.caption.fontSize - 1 },
})
