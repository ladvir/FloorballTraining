import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { BlurView } from 'expo-blur'
import { GradeBadge } from './GradeBadge'
import { t } from '../i18n/strings'
import { colors, glass, gradeLabels, radius, spacing, typography } from '../theme/tokens'

const GRADES = [1, 2, 3, 4, 5] as const

interface GradePickerSheetProps {
  visible: boolean
  value: number | null
  onSelect: (grade: number) => void
  onClose: () => void
}

// Bottom sheet for the coach's "Režim úprav" (Etapa 10, #88): 5 colour-coded options matching
// GradeBadge/gradeColors exactly, opened by tapping a skill's badge - reused for both the current
// grade (SkillRow, SkillDetailScreen) and the target grade (SkillDetailScreen).
// design/images/05-coach-edit-mode.png's grade picker has the color direction right (1 green ->
// 5 red) - used 1:1 as the reference for this sheet's visual.
export function GradePickerSheet({ visible, value, onSelect, onClose }: GradePickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* zIndex + pointerEvents="none" - see GlassCard.tsx for why this decorative backdrop
              needs both, otherwise react-native-web can paint/hit-test it above real content. */}
          <BlurView intensity={glass.intensity} tint={glass.tint} style={styles.sheetBlur} pointerEvents="none" />
          <Text style={styles.title}>{t('skillDetail.editGrade')}</Text>
          {GRADES.map((grade) => (
            <Pressable
              key={grade}
              style={[styles.option, value === grade && styles.optionSelected]}
              onPress={() => {
                onSelect(grade)
                onClose()
              }}
            >
              <GradeBadge grade={grade} size={40} />
              <Text style={styles.optionLabel}>{gradeLabels[grade]}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  sheet: {
    backgroundColor: glass.fillStrong,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    borderBottomWidth: 0,
    overflow: 'hidden',
    padding: spacing.xl,
    gap: spacing.xs + 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
})
