import { FlatList, Modal, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { t } from '../i18n/strings'

interface PickerModalProps<T extends string | number> {
  visible: boolean
  title: string
  options: T[]
  selected: T | null
  onSelect: (value: T | null) => void
  onClose: () => void
}

// Single-select bottom-sheet-style picker shared by the roster's Tým/Ročník/Pozice filters
// (spec section 15) - one implementation instead of three near-identical modals.
export function PickerModal<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: PickerModalProps<T>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item)}
            ListHeaderComponent={
              <Pressable
                style={[styles.option, selected === null && styles.optionSelected]}
                onPress={() => {
                  onSelect(null)
                  onClose()
                }}
              >
                <Text style={styles.optionText}>{t('roster.filterAll')}</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.option, selected === item && styles.optionSelected]}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
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
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
})
