import { useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi, xpApi } from '../../api'
import { useQuery } from '@tanstack/react-query'
import { t, type StringKey } from '../../i18n/strings'
import { colors, glass, gradeColors, radius, spacing, typography } from '../../theme/tokens'
import type { XpRuleCatalogItemDto } from '../../types/domain.types'

// Layer chip colour: A automatic (green), B coach (accent), C home (amber).
const LAYER_COLOR: Record<string, string> = {
  A: gradeColors[1],
  B: colors.accent,
  C: gradeColors[4],
}

// "How to earn XP" catalog (#107): every earnable reward with its effective club value (#106) and
// how it's granted, split into "what I can do myself" vs "what a coach/family rewards". Reached from
// the XP panel on the player card; glass design, consistent with the rest of the app.
export function HowToEarnXpScreen() {
  const navigation = useNavigation()
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['xp', 'rules'],
    queryFn: () => xpApi.getRules(),
  })

  // Optional own-progress (#107 nice-to-have): my own card gives my memberId (shared cache with the
  // rest of the app); a guardian has no player card → the query errors, we just show no progress.
  const { data: myCard } = useQuery({
    queryKey: ['playerskills', 'me'],
    queryFn: playerSkillsApi.getMyCard,
    retry: false,
  })
  const { data: summary } = useQuery({
    queryKey: ['xp', myCard?.memberId],
    queryFn: () => xpApi.getSummary(myCard!.memberId),
    enabled: myCard?.memberId != null,
  })
  const earnedByCode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of summary?.byType ?? []) map[b.type] = b.xp
    return map
  }, [summary])

  const [self, granted] = useMemo(() => {
    const items = data ?? []
    return [items.filter((r) => r.selfActionable), items.filter((r) => !r.selfActionable)]
  }, [data])

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{t('xpHowto.back')}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState message={t('xpHowto.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('xpHowto.title')}</Text>
          <Text style={styles.subtitle}>{t('xpHowto.subtitle')}</Text>

          <Section title={t('xpHowto.self')} hint={t('xpHowto.selfHint')} items={self} earnedByCode={earnedByCode} />
          <Section title={t('xpHowto.granted')} hint={t('xpHowto.grantedHint')} items={granted} earnedByCode={earnedByCode} />
        </ScrollView>
      )}
    </Screen>
  )
}

function Section({
  title,
  hint,
  items,
  earnedByCode,
}: {
  title: string
  hint: string
  items: XpRuleCatalogItemDto[]
  earnedByCode: Record<string, number>
}) {
  if (items.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
      <GlassCard style={styles.card}>
        {items.map((r, i) => (
          <RuleRow key={r.code} rule={r} first={i === 0} earned={earnedByCode[r.code] ?? 0} />
        ))}
      </GlassCard>
    </View>
  )
}

function RuleRow({ rule, first, earned }: { rule: XpRuleCatalogItemDto; first: boolean; earned: number }) {
  const nameKey = `xpHowto.name.${rule.code}` as StringKey
  const descKey = `xpHowto.desc.${rule.code}` as StringKey
  const layerKey = `xpHowto.layer${rule.layer}` as StringKey
  return (
    <View style={[styles.row, !first && styles.rowBorder]}>
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowName}>{t(nameKey)}</Text>
          <View style={[styles.layerChip, { borderColor: LAYER_COLOR[rule.layer] }]}>
            <Text style={[styles.layerText, { color: LAYER_COLOR[rule.layer] }]}>{t(layerKey)}</Text>
          </View>
        </View>
        <Text style={styles.rowDesc}>{t(descKey)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.points}>+{rule.points}</Text>
        {earned > 0 && <Text style={styles.earned}>{t('xpHowto.earned', { xp: String(earned) })}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: colors.accent,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize - 8,
    fontWeight: typography.heading.fontWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    marginTop: -spacing.xs,
  },
  section: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize - 2,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
  },
  card: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  layerChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  layerText: {
    fontSize: typography.caption.fontSize - 2,
    fontWeight: '700',
  },
  rowDesc: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  points: {
    color: gradeColors[4],
    fontSize: typography.title.fontSize - 4,
    fontWeight: '800',
  },
  earned: {
    color: gradeColors[1],
    fontSize: typography.caption.fontSize - 2,
    fontWeight: '600',
  },
})
