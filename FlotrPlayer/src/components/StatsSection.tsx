import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View } from 'react-native'
import { GradeBadge } from './GradeBadge'
import { RadarChart } from './RadarChart'
import { SkillRow } from './SkillRow'
import { t } from '../i18n/strings'
import { colors } from '../theme/tokens'
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
      <View style={styles.overallRow}>
        <Text style={styles.overallLabel}>{t('playerCard.averageGrade')}</Text>
        <GradeBadge grade={overallAverage} size={56} />
      </View>

      {categoryAverages.length >= 3 && <RadarChart categories={categoryAverages} />}

      <View style={styles.legend}>
        {categoryAverages.map((c) => (
          <View key={c.categoryId} style={styles.legendRow}>
            <Text style={styles.legendName}>{c.name}</Text>
            <GradeBadge grade={c.average} size={36} />
          </View>
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
    gap: 24,
  },
  overallRow: {
    alignItems: 'center',
    gap: 8,
  },
  overallLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  legend: {
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundElevated,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legendName: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  skillList: {
    gap: 8,
  },
  empty: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
})
