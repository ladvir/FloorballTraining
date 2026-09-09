import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { CelebrationOverlay } from '../../components/CelebrationOverlay'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { appointmentsApi, attendanceApi, playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, layout, spacing, typography } from '../../theme/tokens'
import { addSkippedRating, getSkippedRatings } from '../../utils/ratingSkipStore'
import { EventRow } from './EventsScreen'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Domovská obrazovka pro účet Hráč (spec section 7, issue #84): vlastní hráčská kartička
// zobrazená hned po přihlášení, ve stylu profesionální sběratelské kartičky.
export function PlayerCardScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useBottomTabBarHeight()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // Captured once (lazy) — Date.now() in the render body trips react-hooks/purity (see HomeTrainingScreen).
  const [weekCutoff] = useState(() => Date.now() + WEEK_MS)
  // Events the player picked "Nechci hodnotit" for — filtered out of the K ohodnocení list for good.
  const [skippedRatings, setSkippedRatings] = useState<number[]>([])
  useEffect(() => {
    getSkippedRatings().then(setSkippedRatings)
  }, [])

  const { data: card, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
  })
  // "Tento týden" (2026-09-09): the Events tab was removed; its list lives here, capped to the
  // coming week. Cache keys shared with the coach EventsScreen.
  const eventsQuery = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: appointmentsApi.getUpcoming })
  const rateableQuery = useQuery({ queryKey: ['appointments', 'rateable'], queryFn: appointmentsApi.getRateable })
  // Only team events the player was marked present at (docházka) are rateable — mirrors the
  // server-side check in RatingsController.Create. Personal events (no team) stay self-rateable.
  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'me', card?.memberId],
    queryFn: () => attendanceApi.getByMember(card!.memberId),
    enabled: card?.memberId != null,
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

  const week = (eventsQuery.data ?? []).filter((a) => new Date(a.start).getTime() <= weekCutoff)
  const presentApptIds = new Set(
    (attendanceQuery.data?.recentRecords ?? [])
      .filter((r) => r.status === 1)
      .map((r) => r.appointmentId),
  )
  const rateable = (rateableQuery.data ?? []).filter(
    (a) =>
      !skippedRatings.includes(a.id) && (a.teamId == null || presentApptIds.has(a.id)),
  )

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        {/* Home shows the card identity + XP only; skills/grades live on the Dovednosti tab (2026-08-04). */}
        <PlayerSkillCard card={card} showSkills={false} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('events.weekTitle')}</Text>

          {card.memberId != null && (
            <Button
              title={t('homeTraining.log')}
              onPress={() => (navigation as any).navigate('HomeTraining', { memberId: card.memberId })}
            />
          )}

          {eventsQuery.isLoading ? (
            <LoadingState inline />
          ) : eventsQuery.isError ? (
            <ErrorState
              inline
              message={t('events.loadError')}
              onRetry={() => eventsQuery.refetch()}
              retrying={eventsQuery.isRefetching}
            />
          ) : week.length === 0 ? (
            <Text style={styles.empty}>{t('events.weekEmpty')}</Text>
          ) : (
            week.map((a) => (
              <EventRow
                key={a.id}
                appointment={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))
          )}

          {/* Recently-ended events still inside the 3-day rating window (hidden when empty or all
              dismissed via "Nechci hodnotit"). */}
          {rateable.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('events.toRate')}</Text>
              {rateable.map((a) => (
                <EventRow
                  key={a.id}
                  appointment={a}
                  expanded={expandedId === a.id}
                  onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  showRating
                  onSkipRating={() => {
                    addSkippedRating(a.id)
                    setSkippedRatings((prev) => [...prev, a.id])
                  }}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
      {/* Congratulates the player for any badge / level earned since their last login. */}
      <CelebrationOverlay memberId={card.memberId} teamId={card.teamIds?.[0]} />
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
  section: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
