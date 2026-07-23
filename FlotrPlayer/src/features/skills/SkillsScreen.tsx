import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { SkillListSection } from '../../components/SkillListSection'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'

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
    <View style={styles.container}>
      <Text style={styles.title}>{t('skills.title')}</Text>
      <SkillListSection categories={card.categories} memberId={card.memberId} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 20,
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
