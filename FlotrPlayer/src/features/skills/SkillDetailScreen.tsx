import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GradeBadge } from '../../components/GradeBadge'
import { HistoryChart } from '../../components/HistoryChart'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
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
// (GET .../history), doporučení trenéra, cílová známka, datum posledního hodnocení. Read-only
// v této etapě - úpravy přijdou s #88.
export function SkillDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { memberId, skill } = route.params as SkillDetailParams

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
        <GradeBadge grade={skill.grade} size={64} />
        <Text style={styles.verbal}>{verbalLabel(skill.grade)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('skillDetail.recommendation')}</Text>
        <Text style={styles.sectionText}>{skill.recommendation || t('skills.noRecommendation')}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Text style={styles.sectionLabel}>{t('skillDetail.targetGrade')}</Text>
          <GradeBadge grade={skill.targetGrade} size={36} />
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.sectionLabel}>{t('skillDetail.lastRated')}</Text>
          <Text style={styles.sectionText}>
            {skill.ratedAt ? formatDate(skill.ratedAt) : t('playerCard.neverRated')}
          </Text>
        </View>
      </View>

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
