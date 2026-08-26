import { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { PickerModal } from '../../components/PickerModal'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { homeTrainingsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, gradeColors, glass, radius, spacing, typography } from '../../theme/tokens'
import { isoDate } from '../../utils/date'
import type { HomeTrainingLogDto } from '../../types/domain.types'

interface Params {
  memberId: number
  /** Deep-link from a challenge's "start" action (#108) — seeds the free-text title. */
  prefillTitle?: string
}

// Confirmed = grade-1 green, Rejected = danger, Pending = muted (matches the web status colours).
const statusColor = (s: HomeTrainingLogDto['status']) =>
  s === 'Confirmed' ? gradeColors[1] : s === 'Rejected' ? colors.danger : colors.textSecondary

const statusLabel = (s: HomeTrainingLogDto['status']) =>
  t(`homeTraining.status${s}` as 'homeTraining.statusPending')

// Player self-logs a completed home training (#104) → capped XP once a guardian/coach confirms.
export function HomeTrainingScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { memberId, prefillTitle } = route.params as Params
  const queryClient = useQueryClient()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [trainingId, setTrainingId] = useState<number | null>(null)
  const [title, setTitle] = useState(prefillTitle ?? '')
  const [duration, setDuration] = useState('')
  // Capture dates once (lazy) — new Date()/Date.now() in the render body trip react-hooks/purity.
  const [today] = useState(() => isoDate(new Date()))
  const [yesterday] = useState(() => isoDate(new Date(Date.now() - 864e5)))
  const [loggedAt, setLoggedAt] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const catalogQuery = useQuery({
    queryKey: ['home-training-catalog'],
    queryFn: homeTrainingsApi.catalog,
  })
  const logsQuery = useQuery({
    queryKey: ['home-trainings', memberId],
    queryFn: () => homeTrainingsApi.getByMember(memberId),
  })

  const catalog = catalogQuery.data ?? []
  const nameById = new Map(catalog.map((c) => [c.id, c.name] as const))

  const createMutation = useMutation({
    mutationFn: () =>
      homeTrainingsApi.create(memberId, {
        trainingId,
        title: title.trim() || null,
        durationMin: duration ? Number(duration) : null,
        loggedAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-trainings', memberId] })
      queryClient.invalidateQueries({ queryKey: ['xp'] })
      setTrainingId(null)
      setTitle('')
      setDuration('')
      setError(null)
    },
    onError: (e: unknown) => {
      const status = isAxiosError(e) ? e.response?.status : undefined
      setError(status === 409 ? t('homeTraining.rateLimit') : t('homeTraining.saveError'))
    },
  })

  const canSubmit = (!!trainingId || title.trim().length > 0) && !createMutation.isPending

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('homeTraining.title')}</Text>
        <Text style={styles.hint}>{t('homeTraining.hint')}</Text>

        {/* Log form */}
        <GlassCard style={styles.form}>
          <Text style={styles.label}>{t('homeTraining.pick')}</Text>
          <Pressable style={styles.select} onPress={() => setPickerOpen(true)}>
            <Text style={trainingId ? styles.selectValue : styles.selectPlaceholder}>
              {trainingId ? (nameById.get(trainingId) ?? title) : t('homeTraining.pickPlaceholder')}
            </Text>
            <Icon name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>

          <Text style={styles.label}>{t('homeTraining.free')}</Text>
          <TextInput
            style={styles.input}
            value={trainingId ? '' : title}
            onChangeText={(v) => {
              setTitle(v)
              setTrainingId(null)
            }}
            placeholder={t('homeTraining.freePlaceholder')}
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>{t('homeTraining.date')}</Text>
              <View style={styles.chips}>
                {[
                  { value: today, label: t('homeTraining.today') },
                  { value: yesterday, label: t('homeTraining.yesterday') },
                ].map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, loggedAt === opt.value && styles.chipActive]}
                    onPress={() => setLoggedAt(opt.value)}
                  >
                    <Text
                      style={[styles.chipText, loggedAt === opt.value && styles.chipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.durationItem}>
              <Text style={styles.label}>{t('homeTraining.duration')}</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            title={t('homeTraining.submit')}
            onPress={() => createMutation.mutate()}
            disabled={!canSubmit}
            loading={createMutation.isPending}
          />
        </GlassCard>

        {/* Log history */}
        {logsQuery.isLoading ? (
          <LoadingState inline />
        ) : logsQuery.isError ? (
          <ErrorState
            inline
            message={t('homeTraining.loadError')}
            onRetry={() => logsQuery.refetch()}
            retrying={logsQuery.isRefetching}
          />
        ) : (logsQuery.data ?? []).length === 0 ? (
          <Text style={styles.empty}>{t('homeTraining.empty')}</Text>
        ) : (
          (logsQuery.data ?? []).map((log) => (
            <GlassCard key={log.id} style={styles.logRow}>
              <View style={styles.logMain}>
                <Text style={styles.logTitle}>{log.title}</Text>
                <Text style={styles.logMeta}>
                  {log.loggedAt.slice(0, 10)}
                  {log.durationMin ? ` · ${t('homeTraining.minutes', { n: String(log.durationMin) })}` : ''}
                </Text>
              </View>
              <Text style={[styles.logStatus, { color: statusColor(log.status) }]}>
                {statusLabel(log.status)}
              </Text>
            </GlassCard>
          ))
        )}

        <Text style={styles.capNote}>{t('homeTraining.capNote')}</Text>
      </ScrollView>

      <PickerModal
        visible={pickerOpen}
        title={t('homeTraining.pick')}
        options={catalog.map((c) => c.id)}
        selected={trainingId}
        formatLabel={(id) => nameById.get(id) ?? String(id)}
        onSelect={(id) => {
          setTrainingId(id)
          setTitle(id != null ? (nameById.get(id) ?? '') : '')
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.accent, fontSize: typography.body.fontSize - 1, fontWeight: '600' },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  hint: { color: colors.textSecondary, fontSize: typography.caption.fontSize, marginBottom: spacing.sm },
  form: { padding: spacing.lg, gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: typography.caption.fontSize, marginTop: spacing.xs },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectValue: { color: colors.textPrimary, fontSize: typography.body.fontSize },
  selectPlaceholder: { color: colors.textMuted, fontSize: typography.body.fontSize },
  input: {
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  durationItem: { width: 96 },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  chipTextActive: { color: colors.textPrimary, fontWeight: '600' },
  error: { color: colors.danger, fontSize: typography.caption.fontSize },
  empty: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', marginTop: spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  logMain: { flex: 1 },
  logTitle: { color: colors.textPrimary, fontSize: typography.bodyBold.fontSize, fontWeight: '600' },
  logMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  logStatus: { fontSize: typography.caption.fontSize, fontWeight: '600' },
  capNote: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
