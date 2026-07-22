import { StyleSheet, Text, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors } from '../../theme/tokens'

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const accountType = useAuthStore((s) => s.accountType)
  const logout = useAuthStore((s) => s.logout)

  if (!user) return null

  return (
    <View style={styles.container}>
      <Avatar firstName={user.firstName} lastName={user.lastName} size={96} />
      <Text style={styles.name}>
        {user.firstName} {user.lastName}
      </Text>
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {accountType === 'Player' ? t('profile.accountTypePlayer') : t('profile.accountTypeCoach')}
        </Text>
      </View>
      <View style={styles.logoutButton}>
        <Button title={t('auth.logout')} onPress={logout} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 32,
    width: '100%',
    maxWidth: 280,
  },
})
