import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { isAxiosError } from 'axios'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'

// Domovská obrazovka pro účet Hráč (spec section 7, issue #84): vlastní hráčská kartička
// zobrazená hned po přihlášení, ve stylu profesionální sběratelské kartičky.
export function PlayerCardScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const navigation = useNavigation()
  const { data: card, isLoading, isError, error, refetch, isRefetching } = useQuery({
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

  if (isError) {
    const notFound = isAxiosError(error) && error.response?.status === 404
    return (
      <Screen>
        <ErrorState
          message={t(notFound ? 'playerCard.notFound' : 'playerCard.loadError')}
          onRetry={notFound ? undefined : () => refetch()}
          retrying={isRefetching}
        />
      </Screen>
    )
  }

  if (!card) return null

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <PlayerSkillCard card={card} expandableCategories />
        <View style={styles.recommendationsButton}>
          <Button
            variant="outline"
            title={t('recommendations.title')}
            onPress={() => (navigation as any).navigate('Recommendations')}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginBottom: spacing.lg,
  },
  recommendationsButton: {
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.lg,
  },
})
