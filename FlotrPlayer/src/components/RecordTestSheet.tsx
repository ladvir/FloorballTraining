import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { BlurView } from 'expo-blur'
import { Button } from './Button'
import { t } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import { isoDate } from '../utils/date'
import type { CreateTestResultDto, TestDefinitionDto } from '../types/domain.types'

interface RecordTestSheetProps {
  visible: boolean
  /** Tests linked to the skill being rated (already filtered client-side by skillId, see #92). */
  tests: TestDefinitionDto[]
  onSubmit: (payload: Omit<CreateTestResultDto, 'memberId'>) => void
  onClose: () => void
  submitting: boolean
  error: string | null
}

// FloorballTraining.CoreBusiness.Enums.TestType - wire value is the raw int (see TestType in
// domain.types.ts), not a string.
const TEST_TYPE_NUMBER = 0
const TEST_TYPE_GRADE = 1

interface FormState {
  testDefinitionId: number | null
  numericValue: string
  gradeOptionId: number | null
  note: string
  testDate: string
}

// Coach's "Zaznamenat test" form on SkillDetailScreen (#92): pick the test (only shown when the
// skill has more than one linked test), enter its result per TestType, save → backend derives the
// skill grade itself (DeriveAndApplySkillGradeAsync), no grade math done here.
export function RecordTestSheet({ visible, tests, onSubmit, onClose, submitting, error }: RecordTestSheetProps) {
  const [today] = useState(() => isoDate(new Date()))
  const [yesterday] = useState(() => isoDate(new Date(Date.now() - 864e5)))
  const blankForm = (): FormState => ({
    testDefinitionId: tests.length === 1 ? tests[0].id : null,
    numericValue: '',
    gradeOptionId: null,
    note: '',
    testDate: today,
  })
  const [form, setForm] = useState<FormState>(blankForm)

  // Modal stays mounted while hidden (matches GradePickerSheet/PickerModal), so the form must
  // reset every time it re-opens rather than leaving the previous test's answer behind. Done
  // during render (React's documented "adjusting state when a prop changes" pattern) instead of
  // a useEffect - React re-renders immediately with the reset state before committing/painting.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setForm(blankForm())
  }

  const { testDefinitionId, numericValue, gradeOptionId, note, testDate } = form
  const setTestDefinitionId = (id: number | null) => setForm((f) => ({ ...f, testDefinitionId: id, gradeOptionId: null, numericValue: '' }))
  const setGradeOptionId = (id: number | null) => setForm((f) => ({ ...f, gradeOptionId: id }))
  const setNumericValue = (v: string) => setForm((f) => ({ ...f, numericValue: v }))
  const setNote = (v: string) => setForm((f) => ({ ...f, note: v }))
  const setTestDate = (v: string) => setForm((f) => ({ ...f, testDate: v }))

  const selectedTest = tests.find((td) => td.id === testDefinitionId) ?? null
  const canSubmit =
    !submitting &&
    selectedTest != null &&
    (selectedTest.testType === TEST_TYPE_GRADE ? gradeOptionId != null : numericValue.trim().length > 0)

  const submit = () => {
    if (!selectedTest) return
    onSubmit({
      testDefinitionId: selectedTest.id,
      numericValue: selectedTest.testType === TEST_TYPE_NUMBER ? Number(numericValue) : null,
      gradeOptionId: selectedTest.testType === TEST_TYPE_GRADE ? gradeOptionId : null,
      testDate,
      note: note.trim() || null,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <BlurView intensity={glass.intensity} tint={glass.tint} style={styles.sheetBlur} pointerEvents="none" />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('recordTest.title')}</Text>

            {tests.length > 1 && (
              <>
                <Text style={styles.label}>{t('recordTest.selectTest')}</Text>
                <Chips
                  items={tests.map((td) => ({ key: td.id, label: td.name }))}
                  selected={testDefinitionId}
                  onSelect={setTestDefinitionId}
                />
              </>
            )}

            {selectedTest?.testType === TEST_TYPE_GRADE && (
              <>
                <Text style={styles.label}>{t('recordTest.value')}</Text>
                <Chips
                  items={selectedTest.gradeOptions.map((g) => ({ key: g.id, label: g.label }))}
                  selected={gradeOptionId}
                  onSelect={setGradeOptionId}
                />
              </>
            )}

            {selectedTest?.testType === TEST_TYPE_NUMBER && (
              <>
                <Text style={styles.label}>
                  {t('recordTest.value')}
                  {selectedTest.unit ? ` (${selectedTest.unit})` : ''}
                </Text>
                <TextInput
                  style={styles.input}
                  value={numericValue}
                  onChangeText={setNumericValue}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            {selectedTest && (
              <>
                <Text style={styles.label}>{t('recordTest.date')}</Text>
                <Chips
                  items={[
                    { key: today, label: t('homeTraining.today') },
                    { key: yesterday, label: t('homeTraining.yesterday') },
                  ]}
                  selected={testDate}
                  onSelect={setTestDate}
                />

                <Text style={styles.label}>{t('recordTest.note')}</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('recordTest.notePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Button title={t('recordTest.submit')} onPress={submit} disabled={!canSubmit} loading={submitting} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Chips<T extends string | number>({
  items,
  selected,
  onSelect,
}: {
  items: { key: T; label: string }[]
  selected: T | null
  onSelect: (key: T) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={[styles.chip, selected === item.key && styles.chipActive]}
          onPress={() => onSelect(item.key)}
        >
          <Text style={[styles.chipText, selected === item.key && styles.chipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
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
    maxHeight: '80%',
  },
  content: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption.fontSize + 1,
  },
})
