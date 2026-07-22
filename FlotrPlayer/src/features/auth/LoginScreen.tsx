import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput } from 'react-native'
import { Button } from '../../components/Button'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((s) => s.login)
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn)
  const error = useAuthStore((s) => s.error)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Flotr - Player</Text>
      <TextInput
        style={styles.input}
        placeholder={t('auth.loginEmailPlaceholder')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.loginPasswordPlaceholder')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={t('auth.loginSubmit')}
        loading={isLoggingIn}
        disabled={!email || !password}
        onPress={() => login({ email, password })}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
  },
})
