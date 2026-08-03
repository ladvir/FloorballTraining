import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { guardianApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, glass, spacing, typography } from '../../theme/tokens'
import { formatFullName } from '../../utils/name'
import type { GuardianChildDto } from '../../types/domain.types'

// Guardian (rodič) home (#102): the parent's own children, each opening the child's read-only
// card. Guardians have no own player card, so this replaces the Hráč's Home tab. Card read is
// club-scoped server-side (CanReadMemberAsync); the list itself is scoped to the caller's own
// links by GET /guardian/children.
export function ChildrenScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0
  const { data: children, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['guardian', 'children'],
    queryFn: guardianApi.getChildren,
  })

  // Snapshot the sibling ids so CardDetail's Previous/Next walks the children, not the club.
  const openChild = (memberId: number) => {
    const memberIds = (children ?? []).map((c) => c.memberId)
    ;(navigation as any).navigate('CardDetail', { memberIds, index: memberIds.indexOf(memberId) })
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    )
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={t('children.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <View style={[styles.container, { paddingBottom: tabBarHeight || spacing.xl }]}>
        <Text style={styles.title}>{t('children.title')}</Text>
        {children?.length === 0 ? (
          <EmptyState message={t('children.empty')} />
        ) : (
          <FlatList
            data={children}
            keyExtractor={(item) => String(item.memberId)}
            renderItem={({ item }) => <ChildRow child={item} onPress={() => openChild(item.memberId)} />}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Screen>
  )
}

function ChildRow({ child, onPress }: { child: GuardianChildDto; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.row}>
        <Avatar firstName={child.firstName} lastName={child.lastName} size={44} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {formatFullName(child.firstName, child.lastName)}
          </Text>
          <Text style={styles.rowMeta}>{child.clubName}</Text>
          <View style={styles.xpLine}>
            <Icon name="ribbon" size={12} color={colors.textSecondary} />
            <Text style={styles.xpText}>{t('xp.level', { level: String(child.level) })}</Text>
            <Text style={styles.xpDot}>·</Text>
            <Text style={styles.xpText}>{t('xp.total', { xp: String(child.totalXp) })}</Text>
          </View>
          {child.clubRank != null && (
            <View style={styles.xpLine}>
              <Icon name="trophy-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.xpText}>
                {t('children.clubRank', { rank: String(child.clubRank), size: String(child.clubSize) })}
              </Text>
            </View>
          )}
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </GlassCard>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    marginTop: 2,
  },
  xpLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  xpDot: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
})
