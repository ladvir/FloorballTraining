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
}

// Player self-rating of a recently-ended event: create once, then view/edit/delete - all gated
// server-side to a 3-day window after the event ends (RatingsController.RatingWindowDays).
// Mirrors FloTr's AppointmentDetailModal RatingSection, reusing the same grade-1..5 picker/badge
// already built for skill grading (GradeBadge/GradePickerSheet share the same color scale).
export function RatingWidget({ appointmentId }: RatingWidgetProps) {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
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
    onSuccess: invalidate,
    onError: onSaveError,
  })

  const confirmDelete = () =>
    Alert.alert(t('ratings.deleteConfirmTitle'), undefined, [
      { text: t('ratings.cancel'), style: 'cancel' },
      { text: t('ratings.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])

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
          <Pressable style={styles.iconButton} onPress={confirmDelete} hitSlop={8}>
            <Icon name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
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
        {editing && (
          <View style={styles.actionButton}>
            <Button title={t('ratings.cancel')} variant="ghost" onPress={() => setEditing(false)} />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
  gradeText: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '600' },
  comment: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  iconButton: { padding: spacing.xs },
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
