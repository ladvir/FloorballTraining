import { StyleSheet, Text, View } from 'react-native'
import { colors, goalkeeperAccent } from '../theme/tokens'

interface AvatarProps {
  firstName: string
  lastName: string
  size?: number
  /** design/images/13-goalkeeper-card.png: goalkeeper's ring uses the amber accent instead of
   * the default blue, matching PlayerSkillCard's position-aware gradient. */
  accent?: 'default' | 'goalkeeper'
}

// No photo field exists anywhere in the Member backend model (verified against Member.cs /
// MemberDto), so the card uses an initials placeholder instead of the "fotografie" the spec
// mentions - the mockups show the same silhouette placeholder for the same reason.
export function Avatar({ firstName, lastName, size = 96, accent = 'default' }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const ringColor = accent === 'goalkeeper' ? goalkeeperAccent.start : colors.accent

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: ringColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
})
