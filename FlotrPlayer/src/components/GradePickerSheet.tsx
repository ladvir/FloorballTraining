import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { GradeBadge } from './GradeBadge'
import { t } from '../i18n/strings'
import { colors, gradeLabels } from '../theme/tokens'

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
export function GradePickerSheet({ visible, value, onSelect, onClose }: GradePickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
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
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
  },
})
