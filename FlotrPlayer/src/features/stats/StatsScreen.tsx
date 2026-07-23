import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { StatsSection } from '../../components/StatsSection'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'

// "Statistiky" tab pro účet Hráč (spec section 14) - sdílí query klíč s PlayerCardScreen/SkillsScreen
// ('playerskills','me'), takže přepočet po uložení trenérem (refetch) se projeví okamžitě zde
// i na zbylých obrazovkách vlastní karty.
export function StatsScreen() {
  const { data: card, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError || !card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('playerCard.loadError')}</Text>
        <Button title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('stats.title')}</Text>
      <StatsSection categories={card.categories} memberId={card.memberId} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
})
