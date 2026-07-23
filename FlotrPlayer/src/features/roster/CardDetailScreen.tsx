import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { isAxiosError } from 'axios'
import { ActivityIndicator, Alert, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
import { BrowseModeBanner } from '../../components/BrowseModeBanner'
import { Button } from '../../components/Button'
import { PlayerSkillCard } from '../../components/PlayerSkillCard'
import { SkillListSection } from '../../components/SkillListSection'
import { StatsSection } from '../../components/StatsSection'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { applyEdit, buildBatchItems, useSkillEditStore } from '../../store/skillEditStore'
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

  const queryClient = useQueryClient()
  const sessionMemberId = useSkillEditStore((s) => s.memberId)
  const edits = useSkillEditStore((s) => s.edits)
  const startEditing = useSkillEditStore((s) => s.startEditing)
  const discardEditing = useSkillEditStore((s) => s.discardEditing)
  const setGrade = useSkillEditStore((s) => s.setGrade)

  const editing = sessionMemberId === memberId
  const hasUnsavedChanges = editing && Object.keys(edits).length > 0

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      if (!hasUnsavedChanges) {
        onConfirm()
        return
      }
      Alert.alert(t('skillDetail.discardTitle'), t('skillDetail.discardMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('skillDetail.discardConfirm'), style: 'destructive', onPress: onConfirm },
      ])
    },
    [hasUnsavedChanges],
  )

  // AC: leaving a work-in-progress edit session - back button, hardware back, swipe-back gesture -
  // always confirms first when there are unsaved changes. `beforeRemove` covers all of those in one
  // place since they all remove this screen from the stack the same way.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!hasUnsavedChanges) return
        e.preventDefault()
        confirmDiscard(() => {
          discardEditing()
          navigation.dispatch(e.data.action)
        })
      }),
    [navigation, hasUnsavedChanges, confirmDiscard, discardEditing],
  )

  // A stable mutable Animated.Value held in state (not a ref) - PanResponder callbacks mutate
  // it directly via Animated.event/spring, they never need it to trigger a re-render itself.
  const [translateX] = useState(() => new Animated.Value(0))
  const canGoPrevious = index > 0
  const canGoNext = index < memberIds.length - 1

  // Swiping to another player's card also leaves the current edit session - same confirmation as
  // any other way of leaving a work-in-progress edit (AC).
  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= memberIds.length) return
      confirmDiscard(() => {
        discardEditing()
        setIndex(nextIndex)
      })
    },
    [memberIds.length, confirmDiscard, discardEditing],
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

  // Merges pending edits into the card's skills so every badge/stat reflects a tapped grade
  // immediately - saving is still a single explicit action (handleSave), this is display-only.
  const effectiveCategories = useMemo(() => {
    if (!card) return []
    if (!editing) return card.categories
    return card.categories.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => applyEdit(skill, edits)),
    }))
  }, [card, editing, edits])

  const effectiveCard = card ? { ...card, categories: effectiveCategories } : undefined

  const toggleEditing = () => {
    if (editing) {
      confirmDiscard(() => discardEditing())
    } else {
      setSaveError(null)
      startEditing(memberId)
    }
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const updated = await playerSkillsApi.saveBatch(memberId, buildBatchItems(edits))
      queryClient.setQueryData(['playerskills', 'card', memberId], updated)
      discardEditing()
    } catch (err) {
      const forbidden = isAxiosError(err) && err.response?.status === 403
      setSaveError(t(forbidden ? 'skillDetail.saveForbidden' : 'skillDetail.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const cardHeader = effectiveCard && (
    <View style={styles.cardHeader}>
      {accountType === 'Player' && <BrowseModeBanner card={effectiveCard} />}
      <Animated.View
        style={{ width: '100%', alignItems: 'center', transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <PlayerSkillCard card={effectiveCard} />
      </Animated.View>
      <View style={styles.statsWrapper}>
        <StatsSection categories={effectiveCategories} memberId={effectiveCard.memberId} />
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, editing && styles.headerEditing]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ {t('roster.back')}</Text>
        </Pressable>
        {canEdit && card && (
          <View style={styles.editControls}>
            {editing && (
              <Button
                title={t('common.save')}
                onPress={handleSave}
                loading={isSaving}
                disabled={!hasUnsavedChanges}
              />
            )}
            <Pressable style={styles.editToggle} onPress={toggleEditing}>
              <Text style={styles.editToggleText}>
                {editing ? `✕ ${t('skillDetail.exitEditMode')}` : `✎ ${t('skillDetail.enterEditMode')}`}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}

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
          categories={effectiveCategories}
          memberId={card.memberId}
          header={cardHeader}
          editable={editing}
          onGradeChange={setGrade}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerEditing: {
    borderBottomColor: colors.accent,
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
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editToggle: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  editToggleText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  saveErrorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
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
  statsWrapper: {
    width: '100%',
    marginTop: 24,
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
