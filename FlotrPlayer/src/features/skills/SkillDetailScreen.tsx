import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { isAxiosError } from 'axios'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { GlassCard } from '../../components/GlassCard'
import { GradeBadge } from '../../components/GradeBadge'
import { GradePickerSheet } from '../../components/GradePickerSheet'
import { HistoryChart } from '../../components/HistoryChart'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi } from '../../api'
import { gradeLabel, t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import { formatDate } from '../../utils/date'
import { useSaveSkill } from '../../utils/saveSkill'
import type { PlayerSkillDto } from '../../types/domain.types'

interface SkillDetailParams {
  memberId: number
  skill: PlayerSkillDto
}

const verbalLabel = (grade: number | null) =>
  grade != null ? gradeLabel(grade as 1 | 2 | 3 | 4 | 5) : t('playerCard.neverRated')

// Detail dovednosti (spec section 11): název, aktuální známka, slovní hodnocení, graf vývoje
// (GET .../history), doporučení trenéra, cílová známka, datum posledního hodnocení. Editable for
// a Coach - grade/target-grade taps and recommendation edits save immediately (useSaveSkill), no
// "Režim úprav" toggle or separate confirm step (supersedes #88's batch-and-confirm flow).
export function SkillDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { memberId, skill: routeSkill } = route.params as SkillDetailParams
  const canEdit = useAuthStore((s) => s.accountType) === 'Coach'

  const saveSkill = useSaveSkill(memberId)
  // The route param is a snapshot from whichever list navigated here - once a save on *this*
  // screen succeeds, the response becomes the source of truth so the badge/fields update in place.
  const skill = useMemo(() => {
    if (!saveSkill.data) return routeSkill
    return saveSkill.data.categories.flatMap((c) => c.skills).find((s) => s.skillId === routeSkill.skillId) ?? routeSkill
  }, [saveSkill.data, routeSkill])

  // A never-rated skill must get its initial grade (tap the badge above) before target
  // grade/recommendation can be set - the write payload always needs a real grade, not null.
  const canEditDetails = canEdit && skill.grade != null
  const [recommendationDraft, setRecommendationDraft] = useState(skill.recommendation ?? '')

  // Coach's "Doporučit k rozvoji" selection - independent of grades/history, so it tracks its
  // own optimistic state instead of flowing through useSaveSkill's batch endpoint.
  const queryClient = useQueryClient()
  const [isFocus, setIsFocus] = useState(skill.isFocus)
  const focusMutation = useMutation({
    mutationFn: (next: boolean) => playerSkillsApi.setSkillFocus(memberId, skill.skillId, next),
    onSuccess: (updated) => {
      queryClient.setQueryData(['playerskills', 'card', memberId], updated)
      queryClient.invalidateQueries({ queryKey: ['playerskills', 'me'] })
      const fresh = updated.categories.flatMap((c) => c.skills).find((s) => s.skillId === skill.skillId)
      if (fresh) setIsFocus(fresh.isFocus)
    },
  })

  const [gradePickerOpen, setGradePickerOpen] = useState(false)
  const [targetPickerOpen, setTargetPickerOpen] = useState(false)

  const {
    data: history,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['playerskills', 'history', memberId, skill.skillId],
    queryFn: () => playerSkillsApi.getSkillHistory(memberId, skill.skillId),
  })

  const saveErrorText =
    saveSkill.error &&
    t(isAxiosError(saveSkill.error) && saveSkill.error.response?.status === 403 ? 'skillDetail.saveForbidden' : 'skillDetail.saveError')

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>

        {saveErrorText && <Text style={styles.saveErrorText}>{saveErrorText}</Text>}

        <Text style={styles.name}>{skill.name}</Text>

        {/* Mockup 09: big centered grade badge with the verbal label beneath it. */}
        <View style={styles.gradeHero}>
          <Pressable disabled={!canEdit} onPress={() => setGradePickerOpen(true)} hitSlop={8}>
            <GradeBadge grade={skill.grade} size={88} />
          </Pressable>
          <Text style={styles.verbal}>{verbalLabel(skill.grade)}</Text>
          {saveSkill.isPending && <ActivityIndicator color={colors.accent} size="small" />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('skillDetail.recommendation')}</Text>
          {canEditDetails ? (
            <TextInput
              style={styles.recommendationInput}
              multiline
              value={recommendationDraft}
              onChangeText={setRecommendationDraft}
              onBlur={() => saveSkill.mutate({ skill, patch: { recommendation: recommendationDraft || null } })}
              placeholder={t('skills.noRecommendation')}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <GlassCard style={styles.recommendationCard}>
              <Text style={styles.sectionText}>{skill.recommendation || t('skills.noRecommendation')}</Text>
            </GlassCard>
          )}
        </View>

        {/* Focus badge for the player, toggle for the coach - drives RecommendationsScreen. */}
        {(canEdit || isFocus) && (
          <Pressable
            disabled={!canEdit || focusMutation.isPending}
            onPress={() => focusMutation.mutate(!isFocus)}
            style={[styles.focusRow, isFocus && styles.focusRowActive]}
          >
            <Icon name={isFocus ? 'star' : 'star-outline'} size={18} color={isFocus ? '#F59E0B' : colors.textSecondary} />
            <Text style={[styles.focusText, isFocus && styles.focusTextActive]}>
              {t(isFocus ? 'skillDetail.focusActive' : 'skillDetail.focusToggle')}
            </Text>
            {focusMutation.isPending && <ActivityIndicator color={colors.accent} size="small" />}
          </Pressable>
        )}

        <View style={styles.metaRow}>
          <GlassCard style={styles.metaBox}>
            <Text style={styles.sectionLabel}>{t('skillDetail.targetGrade')}</Text>
            <Pressable disabled={!canEditDetails} onPress={() => setTargetPickerOpen(true)} hitSlop={8}>
              <GradeBadge grade={skill.targetGrade} size={36} />
            </Pressable>
          </GlassCard>
          <GlassCard style={styles.metaBox}>
            <Text style={styles.sectionLabel}>{t('skillDetail.lastRated')}</Text>
            <Text style={styles.sectionText}>
              {skill.ratedAt ? formatDate(skill.ratedAt) : t('playerCard.neverRated')}
            </Text>
          </GlassCard>
        </View>

        {canEdit && !canEditDetails && <Text style={styles.editHint}>{t('skillDetail.setGradeFirst')}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('skillDetail.historyTitle')}</Text>
          {isLoading ? (
            <LoadingState inline />
          ) : isError ? (
            <ErrorState inline message={t('skillDetail.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
          ) : !history || history.length === 0 ? (
            <Text style={styles.sectionText}>{t('skillDetail.historyEmpty')}</Text>
          ) : (
            <HistoryChart entries={history} />
          )}
        </View>

        <GradePickerSheet
          visible={gradePickerOpen}
          value={skill.grade}
          onSelect={(grade) => saveSkill.mutate({ skill, patch: { grade } })}
          onClose={() => setGradePickerOpen(false)}
        />
        <GradePickerSheet
          visible={targetPickerOpen}
          value={skill.targetGrade}
          onSelect={(grade) => saveSkill.mutate({ skill, patch: { targetGrade: grade } })}
          onClose={() => setTargetPickerOpen(false)}
        />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize + 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  gradeHero: {
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  verbal: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  recommendationCard: {
    padding: spacing.lg,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  focusRowActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.5)',
  },
  focusText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 2,
    fontWeight: '600',
  },
  focusTextActive: {
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
  },
  recommendationInput: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editHint: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaBox: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
})
