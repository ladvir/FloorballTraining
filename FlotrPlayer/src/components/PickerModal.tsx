import { FlatList, Modal, Pressable, StyleSheet, Text } from 'react-native'
import { BlurView } from 'expo-blur'
import { Icon } from './Icon'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import { t } from '../i18n/strings'

interface PickerModalProps<T extends string | number> {
  visible: boolean
  title: string
  options: T[]
  selected: T | null
  onSelect: (value: T | null) => void
  onClose: () => void
  /** Renders each option's display text - defaults to the raw value (fine for team names/years,
   * but position/role are enum-like codes that need a Czech label - see positionLabel/teamRoleLabel). */
  formatLabel?: (value: T) => string
  /** The leading "Vše" row that clears the filter (onSelect(null)). Off for a plain item picker
   * where "no selection" isn't a meaningful choice - e.g. picking a skill to rate (#92). */
  showAllOption?: boolean
}

// Single-select bottom-sheet-style picker shared by the roster's Tým/Ročník/Pozice/Role filters
// (spec section 15) - one implementation instead of four near-identical modals.
export function PickerModal<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  formatLabel,
  showAllOption = true,
}: PickerModalProps<T>) {
  const label = (value: T) => (formatLabel ? formatLabel(value) : String(value))
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* zIndex + pointerEvents="none" - see GlassCard.tsx for why this decorative backdrop
              needs both, otherwise react-native-web can paint/hit-test it above real content. */}
          <BlurView intensity={glass.intensity} tint={glass.tint} style={styles.sheetBlur} pointerEvents="none" />
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item)}
            ListHeaderComponent={
              showAllOption ? (
                <Pressable
                  style={[styles.option, selected === null && styles.optionSelected]}
                  onPress={() => {
                    onSelect(null)
                    onClose()
                  }}
                >
                  <Text style={styles.optionText}>{t('roster.filterAll')}</Text>
                  {selected === null && <Icon name="checkmark" size={18} color={colors.accent} />}
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.option, selected === item && styles.optionSelected]}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <Text style={styles.optionText}>{label(item)}</Text>
                {selected === item && <Icon name="checkmark" size={18} color={colors.accent} />}
              </Pressable>
            )}
          />
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
    maxHeight: '60%',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm + 2,
  },
  optionSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
})
