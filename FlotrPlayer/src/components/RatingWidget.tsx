import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from './Button'
import { GradeBadge } from './GradeBadge'
import { GradePickerSheet } from './GradePickerSheet'
import { Icon } from './Icon'
import { ratingsApi } from '../api'
import { gradeLabel, t } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'

interface RatingWidgetProps {
  appointmentId: number
  /** When given, the widget first asks "rate / don't want to" instead of showing the grade+comment
   * form straight away; picking "don't want to" calls this (home screen drops the event for good). */
  onSkip?: () => void
}

// Player self-rating of a recently-ended event: create once, then view/edit/delete - all gated
// server-side to a 3-day window after the event ends (RatingsController.RatingWindowDays).
// Mirrors FloTr's AppointmentDetailModal RatingSection, reusing the same grade-1..5 picker/badge
// already built for skill grading (GradeBadge/GradePickerSheet share the same color scale).
export function RatingWidget({ appointmentId, onSkip }: RatingWidgetProps) {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  // Gate the create form behind an explicit "chci hodnotit" when a skip option is offered.
  const [wantsToRate, setWantsToRate] = useState(false)
  // Inline delete confirm — Alert.alert with buttons is a no-op on react-native-web (same reason
  // LiveTrainingScreen uses an inline confirm), which made the trash button "do nothing".
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftGrade, setDraftGrade] = useState<number | null>(null)
  const [draftComment, setDraftComment] = useState('')

  const ratingQuery = useQuery({
    queryKey: ['ratings', appointmentId],
    queryFn: () => ratingsApi.getForAppointment(appointmentId),
  })
  const myRating = ratingQuery.data?.[0] ?? null

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ratings', appointmentId] })
  const onSaveError = () => Alert.alert(t('ratings.saveError'))

  const createMutation = useMutation({
    mutationFn: () => ratingsApi.create({ appointmentId, grade: draftGrade!, comment: draftComment || undefined }),
    onSuccess: () => {
      invalidate()
      setDraftGrade(null)
      setDraftComment('')
    },
    onError: onSaveError,
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      ratingsApi.update(myRating!.id, { appointmentId, grade: draftGrade!, comment: draftComment || undefined }),
    onSuccess: () => {
      invalidate()
      setEditing(false)
    },
    onError: onSaveError,
  })

  const deleteMutation = useMutation({
    mutationFn: () => ratingsApi.delete(myRating!.id),
    onSuccess: () => {
      setConfirmingDelete(false)
      invalidate()
    },
    onError: onSaveError,
  })

  const startEdit = () => {
    setDraftGrade(myRating!.grade)
    setDraftComment(myRating!.comment ?? '')
    setEditing(true)
  }

  if (ratingQuery.isLoading) return null

  // Already rated, read-only view with edit/delete affordances.
  if (myRating && !editing) {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <GradeBadge grade={myRating.grade} size={36} />
          <View style={styles.info}>
            <Text style={styles.gradeText}>{gradeLabel(myRating.grade as 1 | 2 | 3 | 4 | 5)}</Text>
            {myRating.comment ? <Text style={styles.comment}>{myRating.comment}</Text> : null}
          </View>
          <Pressable style={styles.iconButton} onPress={startEdit} hitSlop={8}>
            <Icon name="pencil-outline" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setConfirmingDelete(true)} hitSlop={8}>
            <Icon name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        </View>

        {confirmingDelete && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>{t('ratings.deleteConfirmTitle')}</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirmingDelete(false)} hitSlop={6}>
                <Text style={styles.confirmCancel}>{t('ratings.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                hitSlop={6}
              >
                <Text style={styles.confirmDelete}>{t('ratings.delete')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    )
  }

  // No rating yet and the caller offers an opt-out: ask first, don't show the grade/comment form
  // until the player picks "chci hodnotit". "Nechci hodnotit" drops the event via onSkip.
  if (!myRating && !editing && onSkip && !wantsToRate) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.prompt}>{t('ratings.prompt')}</Text>
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Button title={t('ratings.rateCta')} onPress={() => setWantsToRate(true)} />
          </View>
          <View style={styles.actionButton}>
            <Button title={t('ratings.skip')} variant="ghost" onPress={onSkip} />
          </View>
        </View>
      </View>
    )
  }

  // Create form (no rating yet) or edit form (existing rating, prefilled via startEdit).
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.pickRow} onPress={() => setPickerOpen(true)}>
        <GradeBadge grade={draftGrade} size={36} />
        <Text style={styles.pickLabel}>
          {draftGrade ? gradeLabel(draftGrade as 1 | 2 | 3 | 4 | 5) : t('ratings.pickGrade')}
        </Text>
      </Pressable>
      <TextInput
        style={styles.input}
        value={draftComment}
        onChangeText={setDraftComment}
        placeholder={t('ratings.commentPlaceholder')}
        placeholderTextColor={colors.textMuted}
        multiline
      />
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button
            title={t('ratings.save')}
            onPress={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
            disabled={!draftGrade}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </View>
        {(editing || wantsToRate) && (
          <View style={styles.actionButton}>
            <Button
              title={t('ratings.cancel')}
              variant="ghost"
              onPress={() => (editing ? setEditing(false) : setWantsToRate(false))}
            />
          </View>
        )}
      </View>
      <GradePickerSheet
        visible={pickerOpen}
        value={draftGrade}
        onSelect={setDraftGrade}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  prompt: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
  gradeText: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '600' },
  comment: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  iconButton: { padding: spacing.xs },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  confirmText: { flex: 1, color: colors.textSecondary, fontSize: typography.caption.fontSize },
  confirmActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  confirmCancel: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '600' },
  confirmDelete: { color: colors.danger, fontSize: typography.body.fontSize, fontWeight: '700' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pickLabel: { color: colors.textPrimary, fontSize: typography.body.fontSize },
  input: {
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    minHeight: 44,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
})
