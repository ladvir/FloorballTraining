import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/tokens'

interface ScreenProps {
  children: ReactNode
  /** Most screens scroll their own content (FlatList/ScrollView) and just need the background -
   * padding/edges default off so they can lay out exactly like before. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

// Shared dark gradient-mesh background (design/images/06-splash.png, 08-login.png's soft glow
// blobs) - replaces the `flex:1, backgroundColor: colors.background` every screen repeated.
// Pure gradient/opacity, no image asset, so it scales to any screen size for free.
export function Screen({ children, edges = [] }: ScreenProps) {
  return (
    <View style={styles.root}>
      {/* pointerEvents="none" + zIndex - react-native-web stacks position:absolute siblings above
          plain-flow content regardless of DOM order (see GlassCard.tsx for the bug this caused
          there); these decorative layers must never sit above or intercept touches for real
          screen content. */}
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      />
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none">
        <LinearGradient
          colors={[colors.accent + '33', colors.accent + '00']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none">
        <LinearGradient
          colors={[colors.gradientEnd + '2b', colors.gradientEnd + '00']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <SafeAreaView style={styles.content} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  )
}

const GLOW_SIZE = 380

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  glow: {
    position: 'absolute',
    zIndex: -1,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    overflow: 'hidden',
  },
  glowTop: {
    top: -GLOW_SIZE * 0.45,
    right: -GLOW_SIZE * 0.35,
  },
  glowBottom: {
    bottom: -GLOW_SIZE * 0.5,
    left: -GLOW_SIZE * 0.4,
  },
})
