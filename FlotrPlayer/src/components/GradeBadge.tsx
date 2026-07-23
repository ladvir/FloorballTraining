import { StyleSheet, Text, View } from 'react-native'
import { colorForGrade, colors } from '../theme/tokens'

interface GradeBadgeProps {
  /** null renders a muted "not yet rated" badge - skill rows/detail hit this before a Trenér ever grades them. */
  grade: number | null
  size?: number
}

// Big colored number in a circle - spec section 10 is explicit that this must never become a
// progress bar or a percentage, so the badge only ever renders a plain number in an outline.
export function GradeBadge({ grade, size = 44 }: GradeBadgeProps) {
  const color = grade == null ? colors.textMuted : colorForGrade(grade)
  const label = grade == null ? '–' : Number.isInteger(grade) ? String(grade) : grade.toFixed(1)

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          shadowColor: color,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: size * 0.42 }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  text: {
    fontWeight: '700',
  },
})
