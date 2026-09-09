import { useQuery } from '@tanstack/react-query'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { BadgesSection } from '../../components/BadgesSection'
import { Button } from '../../components/Button'
import { Screen } from '../../components/Screen'
import { playerSkillsApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colors, radius, spacing, typography } from '../../theme/tokens'
import { formatFullName } from '../../utils/name'

export function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const user = useAuthStore((s) => s.user)
  const accountType = useAuthStore((s) => s.accountType)
  const logout = useAuthStore((s) => s.logout)

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
          <Button variant="ghost" title={t('auth.logout')} onPress={logout} />
        </View>
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
})
