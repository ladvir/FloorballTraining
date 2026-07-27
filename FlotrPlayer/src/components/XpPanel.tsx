import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'

const STAR_COLOR = '#FBBF24'
const STARS = [1, 2, 3, 4, 5]

// XP/hodnost/level badge na hráčské kartě (issue #96, Etapa 1 gamifikace). Data z GET /xp/member/{id}
// (#94/#95). Rendered inside PlayerSkillCard, so it shows identically on the own card, when browsing
// a teammate, and in the coach edit view. Funguje i pro hráče s 0 XP (Nováček, prázdný progress).
//
// Loading/chyba → nic (karta zůstane funkční); club-scoped endpoint always 200s for a same-club member.
export function XpPanel({ memberId, gradient }: { memberId: number; gradient: string[] }) {
  const { data } = useQuery({
    queryKey: ['xp', memberId],
    queryFn: () => xpApi.getSummary(memberId),
  })
  if (!data) return null

  const { career, bySeason } = data
  const rankKey = `xp.rank${Math.min(6, Math.max(0, career.rankIndex))}` as StringKey
  // Season form of the most recent season (highest SeasonId, list is ordered ascending);
  // no season yet → 0 = all-empty stars, the "prázdný progress" case for a new player.
  const stars = bySeason.length ? bySeason[bySeason.length - 1].stars : 0
  const fillPct = Math.round(Math.min(1, Math.max(0, career.levelProgress)) * 100)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.rankChip}>
          <Icon name="ribbon" size={14} color={colors.textPrimary} />
          <Text style={styles.rankName}>{t(rankKey)}</Text>
        </View>
        <Text style={styles.level}>{t('xp.level', { level: String(career.level) })}</Text>
      </View>

      <View style={styles.track}>
        {fillPct > 0 && (
          <LinearGradient
            colors={gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${fillPct}%` }]}
          />
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.total}>{t('xp.total', { xp: String(data.totalXp) })}</Text>
        <Text style={styles.toNext}>{t('xp.toNextLevel', { xp: String(career.xpToNextLevel) })}</Text>
      </View>

      <View style={styles.seasonRow}>
        <Text style={styles.seasonLabel}>{t('xp.seasonForm')}</Text>
        <View style={styles.stars} accessibilityLabel={`${t('xp.seasonForm')} ${stars}/5`}>
          {STARS.map((n) => (
            <Icon key={n} name={n <= stars ? 'star' : 'star-outline'} size={16} color={n <= stars ? STAR_COLOR : colors.textMuted} />
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rankName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
    fontWeight: '700',
  },
  level: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: spacing.xs,
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
  total: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '700',
  },
  toNext: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  seasonLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '600',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
})
