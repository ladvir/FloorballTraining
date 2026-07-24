import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '../../components/Screen'
import { SkillListSection } from '../../components/SkillListSection'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'

// "Dovednosti" tab pro účet Hráč (spec section 14) - filtrovaný/vyhledatelný seznam dovedností
// vlastní karty (#86). Sdílí query klíč s PlayerCardScreen ('playerskills','me'), takže domovská
// obrazovka a tato záložka čtou stejnou cache.
export function SkillsScreen() {
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

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('skills.title')}</Text>
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
})
