import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ActivityIndicator, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
import { BrowseModeBanner } from '../../components/BrowseModeBanner'
import { Button } from '../../components/Button'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { SkillListSection } from '../../components/SkillListSection'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors } from '../../theme/tokens'

interface CardDetailParams {
  /** Snapshot of the filtered roster's member ids at the moment a row was tapped - navigating
   * within it must never lose position or re-derive from the (possibly since-changed) full roster. */
  memberIds: number[]
  index: number
}

const SWIPE_THRESHOLD = 60

// Etapa 7 (#85): opening a card from the roster/browse list. Shared by both the Trenér's
// Roster tab and the Hráč's "Režim prohlížení" entry (ProfileScreen) - the banner is the only
// thing that differs between the two, driven by accountType, not by which screen pushed this one.
export function CardDetailScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { memberIds, index: initialIndex } = route.params as CardDetailParams
  const accountType = useAuthStore((s) => s.accountType)

  const [index, setIndex] = useState(initialIndex)
  const memberId = memberIds[index]

  const {
    data: card,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['playerskills', 'card', memberId],
    queryFn: () => playerSkillsApi.getCard(memberId),
  })

  // A stable mutable Animated.Value held in state (not a ref) - PanResponder callbacks mutate
  // it directly via Animated.event/spring, they never need it to trigger a re-render itself.
  const [translateX] = useState(() => new Animated.Value(0))
  const canGoPrevious = index > 0
  const canGoNext = index < memberIds.length - 1

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= memberIds.length) return
      setIndex(nextIndex)
    },
    [memberIds.length],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -SWIPE_THRESHOLD && canGoNext) {
            goTo(index + 1)
          } else if (gesture.dx >= SWIPE_THRESHOLD && canGoPrevious) {
            goTo(index - 1)
          }
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false, friction: 8 }).start()
        },
      }),
    [index, canGoNext, canGoPrevious, translateX, goTo],
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ {t('roster.back')}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError || !card ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('roster.cardLoadError')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
        </View>
      ) : (
        <SkillListSection
          categories={card.categories}
          memberId={card.memberId}
          header={
            <View style={styles.cardHeader}>
              {accountType === 'Player' && <BrowseModeBanner card={card} />}
              <Animated.View
                style={{ width: '100%', alignItems: 'center', transform: [{ translateX }] }}
                {...panResponder.panHandlers}
              >
                <PlayerSkillCard card={card} />
              </Animated.View>
            </View>
          }
        />
      )}

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
          onPress={() => goTo(index - 1)}
          disabled={!canGoPrevious}
        >
          <Text style={styles.navText}>‹ {t('roster.previous')}</Text>
        </Pressable>
        <Text style={styles.positionIndicator}>
          {index + 1} / {memberIds.length}
        </Text>
        <Pressable
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          onPress={() => goTo(index + 1)}
          disabled={!canGoNext}
        >
          <Text style={styles.navText}>{t('roster.next')} ›</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundElevated,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundElevated,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  positionIndicator: {
    color: colors.textSecondary,
    fontSize: 13,
  },
})
