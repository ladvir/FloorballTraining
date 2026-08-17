import { useState } from 'react'
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius, spacing, typography } from '../theme/tokens'

type ButtonVariant = 'primary' | 'outline' | 'ghost'

interface ButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  /** design/images/01-design-system.png's 3 button styles - defaults to `primary` (gradient
   * fill) since that's what nearly every existing call site was already using visually. */
  variant?: ButtonVariant
}

// Press-scale via core `Animated` (not react-native-reanimated - installed but never actually
// exercised anywhere in this app, see CardDetailScreen's swipe gesture for the same call), so
// every button gets a small tactile "dynamic" feel with zero new risk. Animated.Value held in
// state (not useRef().current) - the react-hooks/refs lint rule rejects reading a ref during
// render; CardDetailScreen's swipe hit the same thing first, see its translateX.
export function Button({ title, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const [scale] = useState(() => new Animated.Value(1))
  const isDisabled = disabled || loading

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, friction: 6, tension: 80 }).start()

  // Mockup 01/08: primary button is white-on-gradient, not navy-on-gradient.
  const textColor = variant === 'primary' ? colors.textPrimary : colors.accent
  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <Text style={[styles.text, { color: textColor }, variant === 'ghost' && styles.textGhost]}>{title}</Text>
  )

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => !isDisabled && animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={[
          styles.base,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          isDisabled && styles.disabled,
        ]}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  gradientFill: {
    paddingVertical: 14,
    // Missing on an earlier pass - invisible whenever Button is the sole child of a flex column
    // (default alignItems:'stretch' masks it), but a short label collapses to a near-circle
    // wherever Button sits in a row instead (verified in-browser: CardDetailScreen's Save button).
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  textGhost: {
    fontSize: typography.body.fontSize,
  },
})
