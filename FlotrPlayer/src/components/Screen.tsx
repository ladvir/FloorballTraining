import type { ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/tokens'

type Edge = 'top' | 'bottom' | 'left' | 'right'

interface ScreenProps {
  children: ReactNode
  /**
   * Which safe-area edges to inset. Convention:
   * - **Tab screens** (inside MainTabs) use `['top']` — the floating tab bar already clears the
   *   bottom system nav, and their scroll content pads by `useBottomTabBarHeight()`.
   * - **Stack / full screens** (pushed without a tab bar: CardDetail, SkillDetail, Login, …) MUST
   *   include `'bottom'` so their bottom content (nav rows, action buttons) sits ABOVE the system
   *   menu — otherwise it renders under it and is hard to tap.
   *
   * Default is `[]` for screens that scroll their own content and manage padding themselves.
   */
  edges?: Edge[]
}

// Shared dark gradient-mesh background (design/images/06-splash.png, 08-login.png's soft glow
// blobs) - replaces the `flex:1, backgroundColor: colors.background` every screen repeated.
export function Screen({ children, edges = [] }: ScreenProps) {
  const insets = useSafeAreaInsets()

  // Bottom is handled here (not by SafeAreaView) so we can apply the same Android edge-to-edge
  // workaround MainTabs uses: the 3-button nav bar often reports its inset as 0, which would leave
  // bottom content under the system menu. Trust a real reported inset, else fall back to 48dp.
  const wantsBottom = edges.includes('bottom')
  const bottomPad = wantsBottom
    ? insets.bottom > 8
      ? insets.bottom
      : Platform.OS === 'android'
        ? 48
        : insets.bottom
    : 0
  const safeEdges = edges.filter((e) => e !== 'bottom')

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
      <SafeAreaView style={[styles.content, { paddingBottom: bottomPad }]} edges={safeEdges}>
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
