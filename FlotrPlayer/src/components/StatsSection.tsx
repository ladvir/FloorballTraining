import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View } from 'react-native'
import { GlassCard } from './GlassCard'
import { GradeBadge } from './GradeBadge'
import { IconTile } from './Icon'
import { RadarChart } from './RadarChart'
import { SkillRow } from './SkillRow'
import { t } from '../i18n/strings'
import { colors, spacing, typography } from '../theme/tokens'
import { categoryIcon } from '../utils/categoryIcon'
import { summarizeStats } from '../utils/statsSummary'
import type { PlayerSkillCategoryDto, PlayerSkillDto } from '../types/domain.types'

interface StatsSectionProps {
  categories: PlayerSkillCategoryDto[]
  memberId: number
}

// Statistics for the currently open card (spec section 12) - own card for a Hráč (StatsScreen)
// or the selected roster member for a Trenér/browsing Hráč (CardDetailScreen's toggle). Purely
// derived from the `categories` prop, so it recomputes on every render with no cache of its own -
// a refetch after a coach saves a grade or after switching to another player's card just works.
export function StatsSection({ categories, memberId }: StatsSectionProps) {
  const navigation = useNavigation()
  const { overallAverage, categoryAverages, bestSkills, skillsToImprove } = summarizeStats(categories)

  if (overallAverage == null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('stats.empty')}</Text>
      </View>
    )
  }

  const openSkill = (skill: PlayerSkillDto) => {
    ;(navigation as any).navigate('SkillDetail', { memberId, skill })
  }

  return (
    <View style={styles.container}>
      {categoryAverages.length >= 3 && <RadarChart series={[{ categories: categoryAverages }]} />}

      <View style={styles.legend}>
        {categoryAverages.map((c) => (
          <GlassCard key={c.categoryId} style={styles.legendRow}>
            <IconTile name={categoryIcon(c.name)} tileSize={34} size={18} />
            <Text style={styles.legendName}>{c.name}</Text>
            <GradeBadge grade={c.average} size={36} />
          </GlassCard>
        ))}
      </View>

      {bestSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.bestSkills')}</Text>
          <View style={styles.skillList}>
            {bestSkills.map((s) => (
              <SkillRow key={s.skillId} skill={s} onPress={() => openSkill(s)} />
            ))}
          </View>
        </View>
      )}

      {skillsToImprove.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.skillsToImprove')}</Text>
          <View style={styles.skillList}>
            {skillsToImprove.map((s) => (
              <SkillRow key={s.skillId} skill={s} onPress={() => openSkill(s)} />
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xxl,
  },
  legend: {
    gap: spacing.sm + 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  legendName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    flex: 1,
  },
  section: {
    gap: spacing.sm + 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize - 5,
    fontWeight: '700',
  },
  skillList: {
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
})
