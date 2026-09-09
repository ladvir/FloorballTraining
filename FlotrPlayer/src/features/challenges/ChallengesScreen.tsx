import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { ChallengesSection } from '../../components/ChallengesSection'
import { TeamChallengesSection } from '../../components/TeamChallengesSection'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, layout, spacing, typography } from '../../theme/tokens'

// "Výzvy" tab (own menu item since 2026-09-09) — the challenge boards that used to sit on the home
// card: self-completable challenges (#109) + each team's coach-authored challenges (#156).
export function ChallengesScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const { data: card, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <LoadingState />
      </Screen>
    )
  }

  if (isError || !card) {
    return (
      <Screen edges={['top']}>
        <ErrorState message={t('playerCard.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <View style={styles.column}>
          <Text style={styles.title}>{t('nav.challenges')}</Text>
          <Text style={styles.hint}>{t('challenge.pageHint')}</Text>
          <ChallengesSection memberId={card.memberId} />
          {(card.teamIds ?? []).map((teamId) => (
            <TeamChallengesSection key={teamId} teamId={teamId} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.xl, alignItems: 'center' },
  column: { width: '100%', maxWidth: layout.contentMaxWidth },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
})
