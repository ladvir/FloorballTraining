import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'

// Placeholder pending the real home screen (Etapa 6, #84) - this stage only needs to prove the
// auth flow end to end (account type resolved, logout works), not the final screen design.
export function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const accountType = useAuthStore((s) => s.accountType)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('home.greeting', { name: user?.firstName ?? '' })}</Text>
      <Text style={styles.accountType}>{accountType}</Text>
      <Button title={t('auth.logout')} onPress={logout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 20, fontWeight: '600' },
  accountType: { fontSize: 14, color: '#6b7280' },
})
