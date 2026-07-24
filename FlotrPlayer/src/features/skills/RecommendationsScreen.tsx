import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { GradeBadge } from '../../components/GradeBadge'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'

// Trenérova doporučení pro rozvoj přihlášeného hráče na samostatné stránce (user feedback
// 2026-07-24) - skill rows moved off the card, one row per skill with a non-empty
// recommendation, plus the target grade when the coach set one.
export function RecommendationsScreen() {
  const navigation = useNavigation()
  const { data: card, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })

  // Coach-selected focus skills plus anything with a written recommendation.
  const skills = (card?.categories ?? [])
    .flatMap((c) => c.skills)
    .filter((s) => s.isFocus || s.recommendation)

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('recommendations.title')}</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : isError || !card ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t('playerCard.loadError')}</Text>
            <Button variant="outline" title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
          </View>
        ) : skills.length === 0 ? (
          <Text style={styles.emptyText}>{t('recommendations.empty')}</Text>
        ) : (
          skills.map((skill) => (
            <GlassCard key={skill.skillId} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <GradeBadge grade={skill.grade} size={34} />
              </View>
              <Text style={styles.recommendation}>{skill.recommendation}</Text>
              {skill.targetGrade != null && (
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>{t('skillDetail.targetGrade')}</Text>
                  <GradeBadge grade={skill.targetGrade} size={26} glass />
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.accent,
    fontSize: typography.body.fontSize - 1,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginBottom: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skillName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  recommendation: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 1,
    lineHeight: 20,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
})
