import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { Avatar } from './Avatar'
import { GradeBadge } from './GradeBadge'
import { t } from '../i18n/strings'
import { colors } from '../theme/tokens'
import { formatDate } from '../utils/date'
import { positionLabel } from '../utils/position'
import { summarizeCard } from '../utils/skillCard'
import type { PlayerSkillCardDto } from '../types/domain.types'

// The collector-card visual shared by the own-card home screen (#84) and browsing another
// player's card (#85, "otevře jeho kartičku ve stejném designu jako vlastní karta") - one
// implementation so both contexts always render identically.
export function PlayerSkillCard({ card }: { card: PlayerSkillCardDto }) {
  const { averageGrade, lastRatedAt } = summarizeCard(card)

  return (
    <View style={styles.wrapper}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
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
