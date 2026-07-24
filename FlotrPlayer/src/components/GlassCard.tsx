import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { glass, radius } from '../theme/tokens'

interface GlassCardProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** Matches theme/tokens.ts `radius` scale - defaults to the value used by most cards/rows. */
  radius?: number
}

// Frosted-glass panel (design/README.md: "glassmorphism") - BlurView + a translucent tint layer
// on top so content behind it still reads through, per spec. Replaces the ad-hoc
// `backgroundColor: colors.backgroundElevated` boxes duplicated across the app.
export function GlassCard({ children, style, radius: cornerRadius = radius.lg }: GlassCardProps) {
  return (
    <View style={[styles.wrapper, { borderRadius: cornerRadius }, style]}>
      {/* zIndex + pointerEvents="none" - react-native-web stacks position:absolute siblings above
          plain-flow ones regardless of DOM order (verified in-browser: this tint layer was
          painting over a direct-child TextInput and even swallowing its clicks). Without an
          explicit zIndex these two decorative layers aren't reliably behind real content. */}
      <BlurView intensity={glass.intensity} tint={glass.tint} style={styles.backdrop} pointerEvents="none" />
      <View style={[styles.backdrop, { backgroundColor: glass.fill }]} pointerEvents="none" />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
})
