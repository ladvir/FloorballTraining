import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'

// Domovská obrazovka pro účet Hráč (spec section 7, issue #84): vlastní hráčská kartička
// zobrazená hned po přihlášení, ve stylu profesionální sběratelské kartičky.
export function PlayerCardScreen() {
  const { data: card, isLoading, isError, error, refetch, isRefetching } = useQuery({
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

  if (isError) {
    const notFound = isAxiosError(error) && error.response?.status === 404
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t(notFound ? 'playerCard.notFound' : 'playerCard.loadError')}</Text>
        {!notFound && <Button title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />}
      </View>
    )
  }

  if (!card) return null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PlayerSkillCard card={card} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    alignItems: 'center',
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
