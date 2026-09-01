import { useQuery } from '@tanstack/react-query'
import { Image, StyleSheet, Text, View } from 'react-native'
import { API_BASE_URL, xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import type { BadgeStatusDto } from '../types/domain.types'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'

// Collectible milestone badges (#97). Only ever shows *earned* badges - a Player is sent only those
// anyway; a Coach's response also carries locked ones (with progress) but they're filtered out here,
// per feedback that the coach just wants a player's actual collection, not a to-do list.
export function BadgesSection({ memberId }: { memberId: number }) {
  const { data } = useQuery({
    queryKey: ['xp', 'badges', memberId],
    queryFn: () => xpApi.getBadges(memberId),
  })
  const earned = (data ?? []).filter((b) => b.earned)
  if (earned.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('badge.section')}</Text>
      <View style={styles.grid}>
        {earned.map((b) => (
          <BadgeTile key={b.code} badge={b} />
        ))}
      </View>
    </View>
  )
}

function BadgeTile({ badge }: { badge: BadgeStatusDto }) {
  return (
    <View style={styles.tile}>
      <Image source={{ uri: `${API_BASE_URL}/${badge.icon}` }} style={styles.icon} />
      <Text style={styles.name} numberOfLines={3}>
        {t(`badge.${badge.code}.name` as StringKey)}
      </Text>
      <Text style={styles.desc} numberOfLines={3}>
        {t(`badge.${badge.code}.desc` as StringKey)}
      </Text>
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
})
