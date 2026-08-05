import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { RadarChart } from '../../components/RadarChart'
import { Screen } from '../../components/Screen'
import { SkillListSection } from '../../components/SkillListSection'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'
import { summarizeStats } from '../../utils/statsSummary'

// "Dovednosti" tab pro účet Hráč (spec section 14) - filtrovaný/vyhledatelný seznam dovedností
// vlastní karty (#86). Sdílí query klíč s PlayerCardScreen ('playerskills','me'), takže domovská
// obrazovka a tato záložka čtou stejnou cache.
export function SkillsScreen() {
  const navigation = useNavigation()
  const { data: card, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    )
  }

  if (isError || !card) {
    return (
      <Screen>
        <ErrorState message={t('playerCard.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      </Screen>
    )
  }

  const { categoryAverages } = summarizeStats(card.categories)

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('skills.title')}</Text>
        {/* Radar of category averages — moved off the home card (2026-08-04) to the top of Dovednosti. */}
        {categoryAverages.length >= 3 && (
          <View style={styles.radar}>
            <RadarChart series={[{ categories: categoryAverages }]} />
          </View>
        )}
        <View style={styles.recommendationsButton}>
          <Button
            variant="outline"
            title={t('recommendations.title')}
            onPress={() => (navigation as any).navigate('Recommendations')}
          />
        </View>
        <SkillListSection categories={card.categories} memberId={card.memberId} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  radar: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  recommendationsButton: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
})
