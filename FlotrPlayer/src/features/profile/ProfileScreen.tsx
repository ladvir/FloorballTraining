import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { BadgesSection } from '../../components/BadgesSection'
import { Button } from '../../components/Button'
import { Screen } from '../../components/Screen'
import { playerSkillsApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors, radius, spacing, typography } from '../../theme/tokens'
import { formatFullName } from '../../utils/name'

// Required by Google Play (Data safety / privacy policy): must be reachable from inside the
// app, not just linked from the Play Console listing.
const PRIVACY_POLICY_URL = 'https://flotr.cz/flotr/privacy'

export function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const user = useAuthStore((s) => s.user)
  const accountType = useAuthStore((s) => s.accountType)
  const logout = useAuthStore((s) => s.logout)
  const deleteAccount = useAuthStore((s) => s.deleteAccount)
  const isAdmin = !!user?.roles.includes('Admin')
  // Inline confirm, not Alert.alert with buttons - that's a no-op on react-native-web
  // (see RatingWidget/LiveTrainingScreen for the same fix).
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
    } catch {
      setDeleting(false)
      setConfirmingDelete(false)
      Alert.alert(t('profile.deleteAccountError'))
    }
  }

  // Earned milestone badges moved here from the home card (2026-09-09). Shares the card query
  // cache; a Coach/Guardian has no player card so this errors and BadgesSection is just skipped.
  const { data: card } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
    retry: false,
  })

  if (!user) return null

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight || spacing.xxl }]}>
        <Avatar firstName={user.firstName} lastName={user.lastName} size={96} />
        <Text style={styles.name}>{formatFullName(user.firstName, user.lastName)}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t(`profile.accountType${accountType ?? 'Player'}` as StringKey)}
          </Text>
        </View>
        <View style={styles.actionButton}>
          <Button
            variant="ghost"
            title={t('profile.privacyPolicy')}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          />
          <Button variant="ghost" title={t('auth.logout')} onPress={logout} />
        </View>
        {!isAdmin && (
          <View style={styles.dangerZone}>
            {!confirmingDelete ? (
              <Pressable onPress={() => setConfirmingDelete(true)} hitSlop={8}>
                <Text style={styles.deleteAccountLink}>{t('profile.deleteAccountButton')}</Text>
              </Pressable>
            ) : (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>{t('profile.deleteAccountConfirm')}</Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    onPress={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    hitSlop={6}
                  >
                    <Text style={styles.confirmCancel}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable onPress={handleDeleteAccount} disabled={deleting} hitSlop={6}>
                    <Text style={styles.confirmDelete}>{t('profile.deleteAccountButton')}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
        {card?.memberId != null && <BadgesSection memberId={card.memberId} />}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm + 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginTop: spacing.md,
  },
  email: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 2,
  },
  badge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md + 2,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 280,
  },
  dangerZone: {
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  deleteAccountLink: {
    color: colors.danger,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '600',
  },
  confirmRow: {
    width: '100%',
    gap: spacing.sm,
  },
  confirmText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  confirmCancel: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '600' },
  confirmDelete: { color: colors.danger, fontSize: typography.body.fontSize, fontWeight: '700' },
})
