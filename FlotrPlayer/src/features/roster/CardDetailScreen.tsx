import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { isAxiosError } from 'axios'
import { ActivityIndicator, Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CoachAwardsSection } from '../../components/CoachAwardsSection'
import { Icon } from '../../components/Icon'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { Screen } from '../../components/Screen'
import { SkillListSection } from '../../components/SkillListSection'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import { useSaveSkill } from '../../utils/saveSkill'

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
//
// Grade edits (Coach only) save immediately on tap - no "Režim úprav" toggle and no separate
// confirm step (superseded #88's batch-and-confirm flow per later feedback): see useSaveSkill.
export function CardDetailScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { memberIds, index: initialIndex } = route.params as CardDetailParams
  const accountType = useAuthStore((s) => s.accountType)
  const canEdit = accountType === 'Coach'

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

  const saveSkill = useSaveSkill(memberId)

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

  const saveErrorText =
    saveSkill.error &&
    t(isAxiosError(saveSkill.error) && saveSkill.error.response?.status === 403 ? 'skillDetail.saveForbidden' : 'skillDetail.saveError')

  // The card itself now carries the radar/categories/top skills. A browsing Hráč sees ONLY the
  // card (no per-skill list - individual skills are for the owner's own tabs and the Coach's
  // edit flow); no browse-mode banner either, both per user feedback 2026-07-24.
  const cardHeader = card && (
    <View style={styles.cardHeader}>
      <Animated.View
        style={{ width: '100%', alignItems: 'center', transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <PlayerSkillCard card={card} />
      </Animated.View>
      {canEdit && <CoachAwardsSection memberId={card.memberId} />}
    </View>
  )

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>
        {canEdit && saveSkill.isPending && <ActivityIndicator color={colors.accent} size="small" />}
      </View>

      {saveErrorText && <Text style={styles.saveErrorText}>{saveErrorText}</Text>}

      {isLoading ? (
        <LoadingState />
      ) : isError || !card ? (
        <ErrorState message={t('roster.cardLoadError')} onRetry={() => refetch()} retrying={isRefetching} />
      ) : canEdit ? (
        <SkillListSection
          categories={card.categories}
          memberId={card.memberId}
          header={cardHeader}
          editable
          onGradeChange={(skill, grade) => saveSkill.mutate({ skill, patch: { grade } })}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.browseContent}>{cardHeader}</ScrollView>
      )}

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
          onPress={() => goTo(index - 1)}
          disabled={!canGoPrevious}
        >
          <Icon name="chevron-back" size={16} color={colors.textPrimary} />
          <Text style={styles.navText}>{t('roster.previous')}</Text>
        </Pressable>
        <Text style={styles.positionIndicator}>
          {index + 1} / {memberIds.length}
        </Text>
        <Pressable
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          onPress={() => goTo(index + 1)}
          disabled={!canGoNext}
        >
          <Text style={styles.navText}>{t('roster.next')}</Text>
          <Icon name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  backText: {
    color: colors.accent,
    fontSize: typography.body.fontSize - 1,
    fontWeight: '600',
  },
  saveErrorText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize + 1,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  browseContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 2,
    fontWeight: '600',
  },
  positionIndicator: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
  },
})
