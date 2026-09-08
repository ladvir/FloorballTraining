import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { xpApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import type { SaveTeamChallengeDto, TeamChallengeDto } from '../../types/domain.types'

const METRICS = [
  'TrainingAttendance',
  'MatchGoal',
  'HomeTraining',
  'SkillImprovement',
  'TestPersonalRecord',
] as const
const WINDOWS = ['Week', 'Month', 'Season', 'Custom'] as const

interface Params {
  teamId: number
  teamName?: string
}

interface Draft {
  id?: number
  name: string
  description: string
  isManual: boolean
  metric: (typeof METRICS)[number]
  target: string
  window: (typeof WINDOWS)[number]
  startsOn: string
  endsOn: string
  rewardXp: string
  isActive: boolean
}

const emptyDraft = (): Draft => ({
  name: '',
  description: '',
  isManual: false,
  metric: 'TrainingAttendance',
  target: '10',
  window: 'Month',
  startsOn: '',
  endsOn: '',
  rewardXp: '30',
  isActive: true,
})

const toDraft = (c: TeamChallengeDto): Draft => ({
  id: c.id,
  name: c.name,
  description: c.description ?? '',
  isManual: c.isManual,
  metric: (METRICS.find((m) => m === c.metric) ?? 'TrainingAttendance') as Draft['metric'],
  target: String(c.target || 10),
  window: (WINDOWS.find((w) => w === c.window) ?? 'Month') as Draft['window'],
  startsOn: c.startsOn?.slice(0, 10) ?? '',
  endsOn: c.endsOn?.slice(0, 10) ?? '',
  rewardXp: String(c.rewardXp),
  isActive: c.isActive,
})

function draftToDto(d: Draft, teamId: number): SaveTeamChallengeDto {
  const custom = d.window === 'Custom'
  return {
    teamId,
    name: d.name.trim(),
    description: d.description.trim() || null,
    isManual: d.isManual,
    metric: d.isManual ? null : d.metric,
    target: d.isManual ? 0 : Math.max(1, Number(d.target) || 1),
    window: d.window,
    startsOn: custom ? d.startsOn || null : null,
    endsOn: custom ? d.endsOn || null : null,
    rewardXp: Math.max(0, Number(d.rewardXp) || 0),
    isActive: d.isActive,
  }
}

const draftValid = (d: Draft) =>
  d.name.trim().length > 0 &&
  Number(d.rewardXp) >= 0 &&
  (d.isManual || Number(d.target) >= 1) &&
  (d.window !== 'Custom' || (!!d.startsOn && !!d.endsOn && d.endsOn >= d.startsOn))

// Coach CRUD for a team's challenges (#156). Reached from a team event on EventsScreen (coach-only).
export function TeamChallengesScreen() {
  const navigation = useNavigation()
  const { teamId, teamName } = useRoute().params as Params
  const qc = useQueryClient()

  const key = ['team-challenges', 'coach', teamId]
  const query = useQuery({ queryKey: key, queryFn: () => xpApi.listTeamChallenges(teamId) })

  const [draft, setDraft] = useState<Draft | null>(null)
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key })
    qc.invalidateQueries({ queryKey: ['team-challenges', 'team', teamId] })
    qc.invalidateQueries({ queryKey: ['leaderboard'] })
    qc.invalidateQueries({ queryKey: ['team-leaderboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      d.id
        ? xpApi.updateTeamChallenge(d.id, draftToDto(d, teamId))
        : xpApi.createTeamChallenge(draftToDto(d, teamId)),
    onSuccess: () => {
      invalidate()
      setDraft(null)
    },
    onError: () => Alert.alert(t('teamChallenge.saveError')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => xpApi.deleteTeamChallenge(id),
    onSuccess: invalidate,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      done ? xpApi.completeTeamChallenge(id) : xpApi.uncompleteTeamChallenge(id),
    onSuccess: invalidate,
    onError: () => Alert.alert(t('teamChallenge.saveError')),
  })

  const canManage = query.data?.canManage ?? false
  const challenges = query.data?.challenges ?? []

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('roster.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('teamChallenge.title')}</Text>
        <Text style={styles.subtitle}>{teamName ?? t('teamChallenge.subtitle')}</Text>

        {canManage && !draft && (
          <Button title={t('teamChallenge.new')} onPress={() => setDraft(emptyDraft())} />
        )}

        {draft && (
          <DraftForm
            draft={draft}
            saving={saveMutation.isPending}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={() => saveMutation.mutate(draft)}
          />
        )}

        {query.isLoading ? (
          <LoadingState inline />
        ) : query.isError ? (
          <ErrorState inline message={t('teamChallenge.saveError')} onRetry={() => query.refetch()} />
        ) : challenges.length === 0 && !draft ? (
          <EmptyState message={canManage ? t('teamChallenge.emptyCoach') : t('teamChallenge.empty')} />
        ) : (
          challenges.map((c) => (
            <ChallengeRow
              key={c.id}
              c={c}
              onEdit={() => setDraft(toDraft(c))}
              onDelete={() =>
                Alert.alert(t('teamChallenge.delete'), t('teamChallenge.deleteConfirm'), [
                  { text: t('teamChallenge.cancel'), style: 'cancel' },
                  {
                    text: t('teamChallenge.delete'),
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(c.id),
                  },
                ])
              }
              onToggle={(done) => toggleMutation.mutate({ id: c.id, done })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

function ChallengeRow({
  c,
  onEdit,
  onDelete,
  onToggle,
}: {
  c: TeamChallengeDto
  onEdit: () => void
  onDelete: () => void
  onToggle: (done: boolean) => void
}) {
  const pct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100)
  return (
    <GlassCard style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>{c.name}</Text>
        {c.canManage && (
          <View style={styles.rowActions}>
            <Pressable onPress={onEdit} hitSlop={8}>
              <Icon name="create-outline" size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={8}>
              <Icon name="trash-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        )}
      </View>
      {!!c.description && <Text style={styles.rowDesc}>{c.description}</Text>}
      <Text style={styles.rowMeta}>
        {(c.isManual
          ? t('teamChallenge.manual')
          : t(`challenge.metric.${c.metric}` as StringKey)) +
          ' · ' +
          t(`teamChallenge.window.${c.window}` as StringKey) +
          ' · ' +
          t('challenge.rewardXp', { xp: String(c.rewardXp) }) +
          (c.isActive ? '' : ' · ✕')}
      </Text>

      {!c.isManual && (
        <>
          <View style={styles.track}>
            {pct > 0 && <View style={[styles.fill, { width: `${pct}%` }]} />}
          </View>
          <Text style={styles.rowMeta}>
            {t('challenge.progress', { current: String(c.current), target: String(c.target) })}
          </Text>
        </>
      )}

      <View style={styles.rowBottom}>
        <Text style={styles.rowStatus}>
          {c.completed
            ? t('teamChallenge.completedMembers', { count: String(c.completedMembers) })
            : t('teamChallenge.inProgress')}
        </Text>
        {c.canManage && c.isManual && (
          <Pressable style={styles.smallBtn} onPress={() => onToggle(!c.completed)}>
            <Text style={styles.smallBtnText}>
              {c.completed ? t('teamChallenge.undo') : t('teamChallenge.markDone')}
            </Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  )
}

function DraftForm({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: Draft
  saving: boolean
  onChange: (d: Draft) => void
  onCancel: () => void
  onSave: () => void
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })
  return (
    <GlassCard style={styles.form}>
      <Field label={t('teamChallenge.name')}>
        <TextInput
          style={styles.input}
          value={draft.name}
          onChangeText={(name) => set({ name })}
          placeholderTextColor={colors.textMuted}
        />
      </Field>
      <Field label={t('teamChallenge.description')}>
        <TextInput
          style={styles.input}
          value={draft.description}
          onChangeText={(description) => set({ description })}
          placeholderTextColor={colors.textMuted}
        />
      </Field>

      <Chips
        options={[
          { key: 'false', label: t('teamChallenge.derived') },
          { key: 'true', label: t('teamChallenge.isManual') },
        ]}
        value={String(draft.isManual)}
        onSelect={(v) => set({ isManual: v === 'true' })}
      />

      {!draft.isManual && (
        <>
          <Field label={t('teamChallenge.metric')}>
            <Chips
              options={METRICS.map((m) => ({
                key: m,
                label: t(`challenge.metric.${m}` as StringKey),
              }))}
              value={draft.metric}
              onSelect={(metric) => set({ metric: metric as Draft['metric'] })}
            />
          </Field>
          <Field label={t('teamChallenge.target')}>
            <TextInput
              style={styles.input}
              value={draft.target}
              onChangeText={(target) => set({ target })}
              keyboardType="number-pad"
            />
          </Field>
        </>
      )}

      <Field label={t('teamChallenge.windowLabel')}>
        <Chips
          options={WINDOWS.map((w) => ({
            key: w,
            label: t(`teamChallenge.window.${w}` as StringKey),
          }))}
          value={draft.window}
          onSelect={(window) => set({ window: window as Draft['window'] })}
        />
      </Field>

      {draft.window === 'Custom' && (
        <>
          <Field label={t('teamChallenge.startsOn')}>
            <TextInput
              style={styles.input}
              value={draft.startsOn}
              onChangeText={(startsOn) => set({ startsOn })}
              placeholder="2026-02-01"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
          <Field label={t('teamChallenge.endsOn')}>
            <TextInput
              style={styles.input}
              value={draft.endsOn}
              onChangeText={(endsOn) => set({ endsOn })}
              placeholder="2026-02-28"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
        </>
      )}

      <Field label={t('teamChallenge.rewardXp')}>
        <TextInput
          style={styles.input}
          value={draft.rewardXp}
          onChangeText={(rewardXp) => set({ rewardXp })}
          keyboardType="number-pad"
        />
      </Field>

      <Chips
        options={[
          { key: 'true', label: t('teamChallenge.active') },
          { key: 'false', label: '✕' },
        ]}
        value={String(draft.isActive)}
        onSelect={(v) => set({ isActive: v === 'true' })}
      />

      <View style={styles.formActions}>
        <Button title={t('teamChallenge.cancel')} variant="ghost" onPress={onCancel} />
        <Button
          title={t('teamChallenge.save')}
          onPress={onSave}
          loading={saving}
          disabled={!draftValid(draft)}
        />
      </View>
    </GlassCard>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

function Chips({
  options,
  value,
  onSelect,
}: {
  options: { key: string; label: string }[]
  value: string
  onSelect: (key: string) => void
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onSelect(o.key)}
          style={[styles.chip, value === o.key && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === o.key && styles.chipTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.accent, fontSize: typography.body.fontSize - 1, fontWeight: '600' },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 1,
    marginBottom: spacing.sm,
  },
  row: { padding: spacing.lg, gap: spacing.xs },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  rowActions: { flexDirection: 'row', gap: spacing.md },
  rowDesc: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  rowMeta: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rowStatus: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  smallBtn: {
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  smallBtnText: { color: colors.accent, fontSize: typography.caption.fontSize, fontWeight: '700' },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  form: { padding: spacing.lg, gap: spacing.sm },
  field: { gap: 4 },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: glass.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  chipActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: typography.caption.fontSize, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
})
