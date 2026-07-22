import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { GradeBadge } from '../../components/GradeBadge'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'
import { formatDate } from '../../utils/date'
import { positionLabel } from '../../utils/position'
import { summarizeCard } from '../../utils/skillCard'

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

  const { averageGrade, lastRatedAt } = summarizeCard(card)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.cardBorder}>
        <View style={styles.cardInner}>
          <Avatar firstName={card.firstName} lastName={card.lastName} size={112} />
          <Text style={styles.name}>
            {card.firstName} {card.lastName}
          </Text>
          <Text style={styles.meta}>
            {card.clubName}
            {card.teams.length > 0 ? ` · ${card.teams.join(', ')}` : ''}
          </Text>
          <Text style={styles.meta}>{card.birthYear}</Text>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{positionLabel(card.position)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('playerCard.averageGrade')}</Text>
          {averageGrade !== null ? (
            <GradeBadge grade={averageGrade} size={48} />
          ) : (
            <Text style={styles.statValue}>{t('playerCard.neverRated')}</Text>
          )}
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            {lastRatedAt ? t('playerCard.lastRated', { date: formatDate(lastRatedAt) }) : t('playerCard.neverRated')}
          </Text>
        </View>
      </View>
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
  cardBorder: {
    borderRadius: 28,
    padding: 2,
    width: '100%',
    maxWidth: 360,
  },
  cardInner: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 26,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  positionBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  positionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
    maxWidth: 360,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
})
