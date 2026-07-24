import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colorForGrade, colors, glass } from '../theme/tokens'

interface GradeBadgeProps {
  /** null renders a muted "not yet rated" badge - skill rows/detail hit this before a Trenér ever grades them. */
  grade: number | null
  size?: number
  /** Frosted variant (translucent grade-color fill, colored number) - the card's corner badge. */
  glass?: boolean
}

// Big colored number in a circle - spec section 10 is explicit that this must never become a
// progress bar or a percentage, so the badge only ever renders a plain number.
// design/images/01-design-system.png's grade badge is a glossy solid orb: grade-color sphere,
// white number, soft glow - not an outline ring (an earlier pass drew it as one, which read as
// flat/broken next to the mockups, especially the null state's gray highlight blob).
export function GradeBadge({ grade, size = 44, glass: glassVariant }: GradeBadgeProps) {
  const label = grade == null ? '–' : Number.isInteger(grade) ? String(grade) : grade.toFixed(1)

  if (grade == null) {
    return (
      <View style={[styles.badge, styles.badgeEmpty, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.text, { color: colors.textMuted, fontSize: size * 0.42 }]}>{label}</Text>
      </View>
    )
  }

  const color = colorForGrade(grade)
  if (glassVariant) {
    return (
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + '2E',
            borderColor: color + '99',
            shadowColor: color,
            shadowOpacity: 0.5,
          },
        ]}
      >
        <Text style={[styles.text, { color, fontSize: size * 0.4 }]}>{label}</Text>
      </View>
    )
  }
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, shadowColor: color },
      ]}
    >
      {/* Top-lit sheen over the solid color - the "glass sphere" gloss from the design system sheet. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.18)']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.sheen}
        pointerEvents="none"
      />
      <Text style={[styles.text, { color: '#FFFFFF', fontSize: size * 0.44 }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeEmpty: {
    backgroundColor: glass.fill,
    borderColor: glass.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  // zIndex - react-native-web stacks position:absolute siblings above plain-flow content
  // regardless of DOM order (see GlassCard.tsx), so without it the number paints behind the sheen.
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  text: {
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
