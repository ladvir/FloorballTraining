import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/Button'
import { GradeBadge } from '../../components/GradeBadge'
import { GradePickerSheet } from '../../components/GradePickerSheet'
import { HistoryChart } from '../../components/HistoryChart'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { applyEdit, useSkillEditStore } from '../../store/skillEditStore'
import { colors, gradeLabels } from '../../theme/tokens'
import { formatDate } from '../../utils/date'
import type { PlayerSkillDto } from '../../types/domain.types'

interface SkillDetailParams {
  memberId: number
  skill: PlayerSkillDto
}

const verbalLabel = (grade: number | null) =>
  grade != null ? gradeLabels[grade as 1 | 2 | 3 | 4 | 5] : t('playerCard.neverRated')

// Detail dovednosti (spec section 11): název, aktuální známka, slovní hodnocení, graf vývoje
// (GET .../history), doporučení trenéra, cílová známka, datum posledního hodnocení. Editable for
// a coach mid "Režim úprav" (Etapa 10, #88) - the session lives in skillEditStore, started by
// CardDetailScreen, so edits made here are visible there the moment you navigate back.
export function SkillDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { memberId, skill } = route.params as SkillDetailParams

  const sessionMemberId = useSkillEditStore((s) => s.memberId)
  const edits = useSkillEditStore((s) => s.edits)
  const setGrade = useSkillEditStore((s) => s.setGrade)
  const setTargetGrade = useSkillEditStore((s) => s.setTargetGrade)
  const setRecommendation = useSkillEditStore((s) => s.setRecommendation)

  const editing = sessionMemberId === memberId
  const effectiveSkill = editing ? applyEdit(skill, edits) : skill
  // Target grade/recommendation would otherwise be saved alongside an invalid grade of 0 - a
  // never-rated skill must get its initial grade (tap the badge above) before anything else.
  const canEditDetails = editing && effectiveSkill.grade != null

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ {t('roster.back')}</Text>
      </Pressable>

      <Text style={styles.name}>{skill.name}</Text>

      <View style={styles.gradeRow}>
        <Pressable disabled={!editing} onPress={() => setGradePickerOpen(true)} hitSlop={8}>
          <GradeBadge grade={effectiveSkill.grade} size={64} />
        </Pressable>
        <Text style={styles.verbal}>{verbalLabel(effectiveSkill.grade)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('skillDetail.recommendation')}</Text>
        {canEditDetails ? (
          <TextInput
            style={styles.recommendationInput}
            multiline
            value={effectiveSkill.recommendation ?? ''}
            onChangeText={(text) => setRecommendation(effectiveSkill, text || null)}
            placeholder={t('skills.noRecommendation')}
            placeholderTextColor={colors.textMuted}
          />
        ) : (
          <Text style={styles.sectionText}>{effectiveSkill.recommendation || t('skills.noRecommendation')}</Text>
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Text style={styles.sectionLabel}>{t('skillDetail.targetGrade')}</Text>
          <Pressable disabled={!canEditDetails} onPress={() => setTargetPickerOpen(true)} hitSlop={8}>
            <GradeBadge grade={effectiveSkill.targetGrade} size={36} />
          </Pressable>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.sectionLabel}>{t('skillDetail.lastRated')}</Text>
          <Text style={styles.sectionText}>
            {skill.ratedAt ? formatDate(skill.ratedAt) : t('playerCard.neverRated')}
          </Text>
        </View>
      </View>

      {editing && !canEditDetails && <Text style={styles.editHint}>{t('skillDetail.setGradeFirst')}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('skillDetail.historyTitle')}</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : isError ? (
          <View style={styles.historyError}>
            <Text style={styles.sectionText}>{t('skillDetail.loadError')}</Text>
            <Button title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
          </View>
        ) : !history || history.length === 0 ? (
          <Text style={styles.sectionText}>{t('skillDetail.historyEmpty')}</Text>
        ) : (
          <HistoryChart entries={history} />
        )}
      </View>

      <GradePickerSheet
        visible={gradePickerOpen}
        value={effectiveSkill.grade}
        onSelect={(grade) => setGrade(effectiveSkill, grade)}
        onClose={() => setGradePickerOpen(false)}
      />
      <GradePickerSheet
        visible={targetPickerOpen}
        value={effectiveSkill.targetGrade}
        onSelect={(grade) => setTargetGrade(effectiveSkill, grade)}
        onClose={() => setTargetPickerOpen(false)}
      />
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
    gap: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  verbal: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  recommendationInput: {
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editHint: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaBox: {
    gap: 8,
  },
  historyError: {
    gap: 12,
    alignItems: 'flex-start',
  },
})
