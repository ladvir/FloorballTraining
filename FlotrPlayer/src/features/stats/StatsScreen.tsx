import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { Screen } from '../../components/Screen'
import { StatsSection } from '../../components/StatsSection'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'

// "Statistiky" tab pro účet Hráč (spec section 14) - sdílí query klíč s PlayerCardScreen/SkillsScreen
// ('playerskills','me'), takže přepočet po uložení trenérem (refetch) se projeví okamžitě zde
// i na zbylých obrazovkách vlastní karty.
export function StatsScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const { data: card, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    )
  }

  if (isError || !card) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('playerCard.loadError')}</Text>
          <Button variant="outline" title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xxl }]}>
        <Text style={styles.title}>{t('stats.title')}</Text>
        <StatsSection categories={card.categories} memberId={card.memberId} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
})
