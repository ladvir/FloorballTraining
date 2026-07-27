import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Avatar } from './Avatar'
import { GradeBadge } from './GradeBadge'
import { Icon, IconTile } from './Icon'
import { RadarChart } from './RadarChart'
import { XpPanel } from './XpPanel'
import { t } from '../i18n/strings'
import { useAuthStore } from '../store/authStore'
import { colors, glass, goalkeeperAccent, radius, spacing, typography } from '../theme/tokens'
import { categoryIcon } from '../utils/categoryIcon'
import { positionIcon, positionLabel } from '../utils/position'
import { summarizeStats } from '../utils/statsSummary'
import type { PlayerSkillCardDto } from '../types/domain.types'

// The collector-card visual shared by the own-card home screen (#84) and browsing another
// player's card (#85) - one implementation so both contexts always render identically.
//
// Card content per user feedback 2026-07-24: glass overall-grade badge in the top-right corner,
// radar chart right under the position pill, then category averages and the top-3 skills - all
// inside the card. Deliberately NOT shown: pitch silhouette, last-rated date, club/team names,
// full skill list (individual skills stay on the owner's own Dovednosti tab only), and birth
// year is coach-only.
//
// `expandableCategories` (own-card home screen only): tapping a category row unfolds its
// individual skills with grades; tapping a skill opens its detail.
export function PlayerSkillCard({ card, expandableCategories }: { card: PlayerSkillCardDto; expandableCategories?: boolean }) {
  const navigation = useNavigation()
  const showBirthYear = useAuthStore((s) => s.accountType) !== 'Player'
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null)
  const { overallAverage, categoryAverages } = summarizeStats(card.categories)
  const topSkills = card.categories
    .flatMap((c) => c.skills)
    .filter((s) => s.grade != null)
    .sort((a, b) => a.grade! - b.grade!)
    .slice(0, 3)
  // design/images/13-goalkeeper-card.png: amber accent distinguishes a goalkeeper's card from
  // the default blue/violet gradient.
  const isGoalkeeper = card.position === 'Goalkeeper'
  const gradientColors = isGoalkeeper ? [goalkeeperAccent.start, goalkeeperAccent.end] : [colors.gradientStart, colors.gradientEnd]

  return (
    <LinearGradient colors={gradientColors as [string, string]} style={styles.cardBorder}>
      <LinearGradient colors={[colors.backgroundElevated, colors.background]} style={styles.cardInner}>
        {overallAverage != null && (
          <View style={styles.overallBadge}>
            <GradeBadge grade={overallAverage} size={52} glass />
          </View>
        )}
        {/* Position as a glass icon tile, top-left - mirrors the grade badge's corner (user
            feedback 2026-07-24: icon instead of the text pill). */}
        <View style={styles.positionIcon} accessibilityLabel={positionLabel(card.position)}>
          <IconTile
            name={positionIcon(card.position)}
            tileSize={52}
            size={26}
            color={isGoalkeeper ? goalkeeperAccent.start : colors.accent}
          />
        </View>
        <Avatar firstName={card.firstName} lastName={card.lastName} size={112} accent={isGoalkeeper ? 'goalkeeper' : 'default'} />
        <View style={styles.nameBlock}>
          <Text style={styles.firstName}>{card.firstName.toUpperCase()}</Text>
          <Text style={styles.lastName}>{card.lastName.toUpperCase()}</Text>
        </View>
        {showBirthYear && <Text style={styles.meta}>{card.birthYear}</Text>}

        <XpPanel memberId={card.memberId} gradient={gradientColors} />

        {categoryAverages.length >= 3 && (
          <RadarChart series={[{ categories: categoryAverages, color: isGoalkeeper ? goalkeeperAccent.start : undefined }]} />
        )}

        {categoryAverages.length > 0 && (
          <View style={styles.section}>
            {categoryAverages.map((c) => {
              const expanded = expandableCategories && expandedCategoryId === c.categoryId
              const skills = expanded
                ? (card.categories.find((cat) => cat.categoryId === c.categoryId)?.skills ?? [])
                : []
              return (
                <View key={c.categoryId}>
                  <Pressable
                    disabled={!expandableCategories}
                    onPress={() => setExpandedCategoryId(expanded ? null : c.categoryId)}
                    style={styles.sectionRow}
                  >
                    <IconTile name={categoryIcon(c.name)} tileSize={30} size={16} />
                    <Text style={styles.sectionRowName}>{c.name}</Text>
                    <GradeBadge grade={c.average} size={30} />
                    {expandableCategories && (
                      <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                    )}
                  </Pressable>
                  {expanded &&
                    skills.map((skill) => (
                      <Pressable
                        key={skill.skillId}
                        style={styles.skillSubRow}
                        onPress={() => (navigation as any).navigate('SkillDetail', { memberId: card.memberId, skill })}
                      >
                        <Text style={styles.skillSubRowName}>{skill.name}</Text>
                        <GradeBadge grade={skill.grade} size={24} />
                      </Pressable>
                    ))}
                </View>
              )
            })}
          </View>
        )}

        {topSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('stats.bestSkills')}</Text>
            {topSkills.map((s) => (
              <View key={s.skillId} style={styles.sectionRow}>
                <Text style={styles.sectionRowName}>{s.name}</Text>
                <GradeBadge grade={s.grade} size={30} />
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  cardBorder: {
    borderRadius: radius.xxl + 2,
    padding: 2,
    width: '100%',
    maxWidth: 360,
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  cardInner: {
    borderRadius: radius.xxl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  overallBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
  },
  positionIcon: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 1,
  },
  nameBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  firstName: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize - 4,
    fontWeight: '600',
    letterSpacing: 2,
  },
  lastName: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 2,
    fontWeight: '800',
    letterSpacing: 1.5,
    lineHeight: typography.heading.lineHeight - 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionRowName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
    fontWeight: '600',
  },
  skillSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xxl + spacing.md,
    paddingRight: spacing.md,
  },
  skillSubRowName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 2,
  },
})
