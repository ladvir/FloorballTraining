import { useQuery } from '@tanstack/react-query'
import { Image, StyleSheet, Text, View } from 'react-native'
import { API_BASE_URL, xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import type { BadgeStatusDto } from '../types/domain.types'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'

// Collectible milestone badges (#97). The API already tailors the list to the caller: a Coach sees
// every badge (locked ones greyed out with progress, so they know what a player is close to), a
// Player only ever receives badges they've already earned - so this component never needs its own
// earned/locked branching logic beyond how to render whatever came back.
export function BadgesSection({ memberId }: { memberId: number }) {
  const { data } = useQuery({
    queryKey: ['xp', 'badges', memberId],
    queryFn: () => xpApi.getBadges(memberId),
  })
  if (!data || data.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('badge.section')}</Text>
      <View style={styles.grid}>
        {data.map((b) => (
          <BadgeTile key={b.code} badge={b} />
        ))}
      </View>
    </View>
  )
}

function BadgeTile({ badge }: { badge: BadgeStatusDto }) {
  const pct = Math.round(badge.progress * 100)
  return (
    <View style={styles.tile}>
      <Image
        source={{ uri: `${API_BASE_URL}/${badge.icon}` }}
        style={[styles.icon, !badge.earned && styles.iconLocked]}
      />
      <Text style={styles.name} numberOfLines={2}>
        {t(`badge.${badge.code}.name` as StringKey)}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {t(`badge.${badge.code}.desc` as StringKey)}
      </Text>
      {!badge.earned && (
        <>
          <View style={styles.track}>
            {pct > 0 && <View style={[styles.fill, { width: `${pct}%` }]} />}
          </View>
          <Text style={styles.progress}>{badge.current} / {badge.threshold}</Text>
        </>
      )}
    </View>
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
  title: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    width: 48,
    height: 48,
  },
  iconLocked: {
    opacity: 0.35,
  },
  name: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  desc: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize - 2,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  progress: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize - 2,
  },
})
