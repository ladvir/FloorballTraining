import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { LogoMark } from '../../components/LogoMark'
import { Screen } from '../../components/Screen'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors, radius, spacing, typography } from '../../theme/tokens'

// design/images/08-login.png: logo lockup, glass card wrapping labeled inputs, password
// show/hide, full-width gradient submit. Previously the one screen in the app that ignored the
// dark/glass theme entirely (plain white default RN form) - see plan Fáze B.
export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((s) => s.login)
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn)
  const error = useAuthStore((s) => s.error)

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <LogoMark size={56} />
          <Text style={styles.wordmark}>{t('common.appName').toUpperCase()}</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>{t('auth.loginEmailPlaceholder')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.loginEmailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t('auth.loginPasswordPlaceholder')}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t('auth.loginPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={t('auth.togglePasswordVisibility')}
              hitSlop={8}
            >
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.submitWrapper}>
            <Button
              title={t('auth.loginSubmit')}
              loading={isLoggingIn}
              disabled={!email || !password}
              onPress={() => login({ email, password })}
            />
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    letterSpacing: 1,
  },
  card: {
    padding: spacing.xl,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    // Nested inside GlassCard's own blur+tint, so this needs more contrast than the app's usual
    // `glass.fill`/`glass.border` (0.06/0.14) to still read as a distinct field at rest, not
    // just on focus - verified in-browser, the low-alpha tokens were nearly invisible here.
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.lg,
  },
  passwordRow: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  submitWrapper: {
    marginTop: spacing.sm,
  },
})
