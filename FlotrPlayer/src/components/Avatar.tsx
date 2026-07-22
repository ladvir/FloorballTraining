import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'

interface AvatarProps {
  firstName: string
  lastName: string
  size?: number
}

// No photo field exists anywhere in the Member backend model (verified against Member.cs /
// MemberDto), so the card uses an initials placeholder instead of the "fotografie" the spec
// mentions - the mockups show the same silhouette placeholder for the same reason.
export function Avatar({ firstName, lastName, size = 96 }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
})
