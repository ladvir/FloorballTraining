import { useQuery } from '@tanstack/react-query'
import { useContext, useMemo, useState } from 'react'
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { PickerModal } from '../../components/PickerModal'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusView'
import { playerSkillsApi, xpApi } from '../../api'
import { t, type StringKey } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { colorForGrade, colors, glass, radius, spacing, typography } from '../../theme/tokens'
import type {
  LeaderboardRowDto,
  MemberTeamRole,
  PlayerPosition,
  PlayerSkillRosterMemberDto,
} from '../../types/domain.types'
import { categoryIcon } from '../../utils/categoryIcon'
import { formatFullName } from '../../utils/name'
import { positionLabel } from '../../utils/position'
import { teamRoleLabel } from '../../utils/teamRole'

type ActiveFilter = 'team' | 'year' | 'position' | 'role' | null

// Seznam a prohlížení hráčů klubu (spec section 15, issues #84+#85): roster dostupný dle
// GET /playerskills/roster, s živým vyhledáváním a filtry Tým/Ročník/Pozice. Výběr hráče otevře
// jeho kartičku (CardDetailScreen) s navigací swipe/šipkami v rámci právě zobrazeného
// (filtrovaného) seznamu. Tab root pro oba typy účtu (Hráč read-only, od 2026-07-24 jako
// vlastní záložka místo tlačítka v profilu).
export function RosterScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0
  const { data: roster, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'roster'],
    queryFn: playerSkillsApi.getRoster,
  })

  // XP per player in one club-scoped call (shares cache with the Leaderboard tab). Used to show each
  // player's rank + total XP in the list. If it fails/empty, rows just render without the XP line.
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'season'],
    queryFn: () => xpApi.getLeaderboard({ sort: 'season' }),
  })
  const xpByMember = useMemo(() => {
    const map = new Map<number, LeaderboardRowDto>()
    for (const r of leaderboard?.rows ?? []) map.set(r.memberId, r)
    return map
  }, [leaderboard])

  // Birth year is coach-only info (user feedback 2026-07-24): players see neither the year in
  // rows nor the Ročník filter.
  const isCoach = useAuthStore((s) => s.accountType) === 'Coach'

  const [search, setSearch] = useState('')
  const [team, setTeam] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [position, setPosition] = useState<PlayerPosition | null>(null)
  const [role, setRole] = useState<MemberTeamRole | null>(null)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null)

  const teams = useMemo(
    () => Array.from(new Set((roster ?? []).flatMap((m) => m.teams))).sort(),
    [roster],
  )
  const years = useMemo(
    () => Array.from(new Set((roster ?? []).map((m) => m.birthYear))).sort((a, b) => b - a),
    [roster],
  )
  const positions = useMemo(
    () => Array.from(new Set((roster ?? []).map((m) => m.position))),
    [roster],
  )
  const roles = useMemo(
    () => Array.from(new Set((roster ?? []).map((m) => m.teamRole))),
    [roster],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (roster ?? []).filter((m) => {
      if (query && !`${m.firstName} ${m.lastName}`.toLowerCase().includes(query)) return false
      if (team && !m.teams.includes(team)) return false
      if (year && m.birthYear !== year) return false
      if (position && m.position !== position) return false
      if (role && m.teamRole !== role) return false
      return true
    })
  }, [roster, search, team, year, position, role])

  const hasActiveFilters = Boolean(search || team || year || position || role)

  // The navigated-to member ids are a snapshot of the currently filtered list, not the full
  // roster - so Previous/Next inside CardDetailScreen never loses position within what the
  // user was actually looking at (AC: "bez ztráty pozice ve filtrovaném seznamu").
  const openMember = (memberId: number) => {
    const memberIds = filtered.map((m) => m.memberId)
    const index = memberIds.indexOf(memberId)
    ;(navigation as any).navigate('CardDetail', { memberIds, index })
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
        <ErrorState message={t('roster.loadError')} onRetry={() => refetch()} retrying={isRefetching} />
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <View style={[styles.container, { paddingBottom: tabBarHeight || spacing.xl }]}>
        <Text style={styles.title}>{t('roster.title')}</Text>

        <View style={styles.searchRow}>
          <Icon name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.search}
            placeholder={t('roster.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterRow}>
          <FilterChip label={t('roster.filterTeam')} value={team} onPress={() => setActiveFilter('team')} />
          {isCoach && <FilterChip label={t('roster.filterYear')} value={year} onPress={() => setActiveFilter('year')} />}
          <FilterChip
            label={t('roster.filterPosition')}
            value={position ? positionLabel(position) : null}
            onPress={() => setActiveFilter('position')}
          />
          <FilterChip
            label={t('roster.filterRole')}
            value={role ? teamRoleLabel(role) : null}
            onPress={() => setActiveFilter('role')}
          />
        </View>

        {hasActiveFilters && (
          <Pressable
            onPress={() => {
              setSearch('')
              setTeam(null)
              setYear(null)
              setPosition(null)
              setRole(null)
            }}
          >
            <Text style={styles.clearFilters}>{t('roster.clearFilters')}</Text>
          </Pressable>
        )}

        {roster?.length === 0 ? (
          <EmptyState message={t('roster.empty')} />
        ) : filtered.length === 0 ? (
          <EmptyState message={t('roster.noResults')} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.memberId)}
            renderItem={({ item }) => (
              <RosterRow
                member={item}
                xp={xpByMember.get(item.memberId)}
                onPress={() => openMember(item.memberId)}
                showBirthYear={isCoach}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}

        <PickerModal
          visible={activeFilter === 'team'}
          title={t('roster.filterTeam')}
          options={teams}
          selected={team}
          onSelect={setTeam}
          onClose={() => setActiveFilter(null)}
        />
        <PickerModal
          visible={activeFilter === 'year'}
          title={t('roster.filterYear')}
          options={years}
          selected={year}
          onSelect={setYear}
          onClose={() => setActiveFilter(null)}
        />
        <PickerModal
          visible={activeFilter === 'position'}
          title={t('roster.filterPosition')}
          options={positions}
          selected={position}
          onSelect={setPosition}
          onClose={() => setActiveFilter(null)}
          formatLabel={positionLabel}
        />
        <PickerModal
          visible={activeFilter === 'role'}
          title={t('roster.filterRole')}
          options={roles}
          selected={role}
          onSelect={setRole}
          onClose={() => setActiveFilter(null)}
          formatLabel={teamRoleLabel}
        />
      </View>
    </Screen>
  )
}

function FilterChip({ label, value, onPress }: { label: string; value: string | number | null; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{value ?? label}</Text>
    </Pressable>
  )
}

function RosterRow({
  member,
  xp,
  onPress,
  showBirthYear,
}: {
  member: PlayerSkillRosterMemberDto
  xp: LeaderboardRowDto | undefined
  onPress: () => void
  showBirthYear: boolean
}) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.row}>
        <Avatar
          firstName={member.firstName}
          lastName={member.lastName}
          size={44}
          accent={member.position === 'Goalkeeper' ? 'goalkeeper' : 'default'}
        />
        <View style={styles.rowInfo}>
          <View style={styles.rowNameLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {formatFullName(member.firstName, member.lastName)}
            </Text>
            <View style={[styles.positionPill, member.position === 'Goalkeeper' && styles.positionPillGoalkeeper]}>
              <Text style={styles.positionPillText}>{positionLabel(member.position)}</Text>
            </View>
          </View>
          {xp && (
            <View style={styles.xpLine}>
              <Icon name="ribbon" size={12} color={colors.textSecondary} />
              <Text style={styles.xpRank}>
                {t(`xp.rank${Math.min(6, Math.max(0, xp.careerRankIndex))}` as StringKey)}
              </Text>
              <Text style={styles.xpDot}>·</Text>
              <Text style={styles.xpTotal}>{t('xp.total', { xp: String(xp.lifetimeXp) })}</Text>
            </View>
          )}
          {showBirthYear && <Text style={styles.rowMeta}>{member.birthYear}</Text>}
          {/* One strip row per category position - a "Both" player gets a field row + a
              goalkeeper row instead of 11 squeezed segments. Each glassy segment: category
              icon on top, its grade below, tinted by the grade color scale. */}
          {Array.from(new Set(member.categoryGrades.map((c) => c.position))).map((pos) => (
            <View key={pos} style={styles.gradeStrip}>
              {member.categoryGrades
                .filter((c) => c.position === pos)
                .map((c) => {
                  const color = c.average != null ? colorForGrade(c.average) : null
                  return (
                    <View
                      key={c.categoryId}
                      style={[
                        styles.gradeSegment,
                        color ? { backgroundColor: color + '2E', borderColor: color + '73' } : styles.gradeSegmentEmpty,
                      ]}
                      accessibilityLabel={c.name}
                    >
                      <Icon name={categoryIcon(c.name)} size={13} color={color ?? colors.textMuted} />
                      <Text style={[styles.gradeSegmentText, { color: color ?? colors.textMuted }]}>
                        {c.average != null ? c.average.toFixed(1) : '–'}
                      </Text>
                    </View>
                  )
                })}
            </View>
          ))}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize - 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: glass.fill,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: glass.border,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize + 1,
  },
  clearFilters: {
    color: colors.accent,
    fontSize: typography.caption.fontSize + 1,
    marginBottom: spacing.md,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowInfo: {
    flex: 1,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    flexShrink: 1,
  },
  // Mockup 03: small colored position pill right of the name (amber for goalkeepers, matching
  // the goalkeeper card accent).
  positionPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.45)',
  },
  positionPillGoalkeeper: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.5)',
  },
  positionPillText: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
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
  xpRank: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  xpDot: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  xpTotal: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  // Mockup 03-adjacent: one glassy segment per category, tinted by the grade color scale -
  // an at-a-glance profile of the whole card without opening it.
  gradeStrip: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  gradeSegment: {
    flex: 1,
    paddingVertical: spacing.xs,
    gap: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeSegmentEmpty: {
    backgroundColor: glass.fill,
    borderColor: glass.border,
  },
  gradeSegmentText: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '700',
  },
})
