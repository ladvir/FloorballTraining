import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LogoMark } from '../../components/LogoMark'
import { Screen } from '../../components/Screen'
import { t } from '../../i18n/strings'
import { colors, radius, spacing, typography } from '../../theme/tokens'

// design/images/06-splash.png: centered logo lockup on the gradient-glow Screen background +
// a thin animated gradient loading bar. Shown in App.tsx while authStore.hydrate() resolves,
// replacing the previous bare ActivityIndicator.
export function SplashScreen() {
  // Animated.Value held in state, not useRef().current - react-hooks/refs rejects reading a
  // ref during render (same fix as Button.tsx / CardDetailScreen's swipe translateX).
  const [shimmer] = useState(() => new Animated.Value(0))

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-BAR_WIDTH, BAR_WIDTH] })

  return (
    <Screen>
      <View style={styles.container}>
        <LogoMark size={96} />
        <Text style={styles.wordmark}>{t('common.appName').toUpperCase()}</Text>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { transform: [{ translateX }] }]}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    </Screen>
  )
}

const BAR_WIDTH = 120

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    letterSpacing: 2,
  },
  barTrack: {
    width: 160,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: spacing.xxl,
  },
  barFill: {
    width: BAR_WIDTH,
    height: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
})
