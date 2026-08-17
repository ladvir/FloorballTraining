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
type Sort = 'season' | 'career'

const MEDALS = ['🥇', '🥈', '🥉']
const STAR_COLOR = '#FBBF24'

// Seznam a prohlížení hráčů klubu (spec section 15, issues #84+#85): roster dostupný dle
// GET /playerskills/roster, s živým vyhledáváním a filtry Tým/Ročník/Pozice. Výběr hráče otevře
// jeho kartičku (CardDetailScreen).
//
// Žebříček je sloučen do této stránky (user feedback 2026-08-04): přepínač Sezónní/Kariérní XP,
// hráč měsíce a pořadí (medaile/pozice + XP) přímo u hráčů — samostatná záložka Žebříček zrušena.
export function RosterScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0
  const [sort, setSort] = useState<Sort>('season')

  const { data: roster, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'roster'],
    queryFn: playerSkillsApi.getRoster,
  })

  // Club XP in one call — drives the ranking + XP line on each row. If it fails/empty, rows still
  // render (just without the XP line and ordered by name).
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', sort],
    queryFn: () => xpApi.getLeaderboard({ sort }),
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

  // Ranked by leaderboard position (players without XP fall to the end, by surname) — the roster
  // now reads top-to-bottom as a žebříček while keeping search/filters.
  const ranked = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = xpByMember.get(a.memberId)?.position ?? Number.POSITIVE_INFINITY
      const pb = xpByMember.get(b.memberId)?.position ?? Number.POSITIVE_INFINITY
      if (pa !== pb) return pa - pb
      return a.lastName.localeCompare(b.lastName)
    })
  }, [filtered, xpByMember])

  const hasActiveFilters = Boolean(search || team || year || position || role)
  const potm = leaderboard?.playerOfMonth

  const openMember = (memberId: number) => {
    const memberIds = ranked.map((m) => m.memberId)
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

        {/* Season vs. career XP toggle (moved here from the Žebříček tab). */}
        <View style={styles.toggle}>
          {(['season', 'career'] as Sort[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSort(s)}
              style={[styles.toggleItem, sort === s && styles.toggleItemActive]}
            >
              <Text style={[styles.toggleText, sort === s && styles.toggleTextActive]}>
                {t(s === 'season' ? 'leaderboard.sortSeason' : 'leaderboard.sortCareer')}
              </Text>
            </Pressable>
          ))}
        </View>

        {potm && (
          <GlassCard style={styles.potm}>
            <Icon name="trophy" size={20} color={STAR_COLOR} />
            <View style={styles.potmText}>
              <Text style={styles.potmLabel}>{t('leaderboard.playerOfMonth')}</Text>
              <Text style={styles.potmName}>{potm.name}</Text>
            </View>
            <Text style={styles.potmXp}>{t('leaderboard.recentXp', { xp: String(potm.recentXp) })}</Text>
          </GlassCard>
        )}

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
        ) : ranked.length === 0 ? (
          <EmptyState message={t('roster.noResults')} />
        ) : (
          <FlatList
            data={ranked}
            keyExtractor={(item) => String(item.memberId)}
            renderItem={({ item }) => (
              <RosterRow
                member={item}
                xp={xpByMember.get(item.memberId)}
                sort={sort}
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
  sort,
  onPress,
  showBirthYear,
}: {
  member: PlayerSkillRosterMemberDto
  xp: LeaderboardRowDto | undefined
  sort: Sort
  onPress: () => void
  showBirthYear: boolean
}) {
  const medal = xp && xp.position <= 3 ? MEDALS[xp.position - 1] : null
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.row}>
        {xp && (
          <View style={styles.rankCol}>
            {medal ? <Text style={styles.medal}>{medal}</Text> : <Text style={styles.rankNum}>{xp.position}</Text>}
          </View>
        )}
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
              {sort === 'season' ? (
                <>
                  <Text style={styles.xpTotal}>{t('leaderboard.seasonXp', { xp: String(xp.seasonXp) })}</Text>
                  <Icon name="star" size={12} color={STAR_COLOR} />
                  <Text style={styles.xpRank}>{xp.stars}</Text>
                </>
              ) : (
                <>
                  <Icon name="ribbon" size={12} color={colors.textSecondary} />
                  <Text style={styles.xpRank}>
                    {t(`xp.rank${Math.min(6, Math.max(0, xp.careerRankIndex))}` as StringKey)}
                  </Text>
                  <Text style={styles.xpDot}>·</Text>
                  <Text style={styles.xpTotal}>{t('xp.total', { xp: String(xp.lifetimeXp) })}</Text>
                </>
              )}
            </View>
          )}
          {showBirthYear && <Text style={styles.rowMeta}>{member.birthYear}</Text>}
          {/* One strip row per category position - a "Both" player gets a field row + a
              goalkeeper row instead of 11 squeezed segments. */}
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
  toggle: {
    flexDirection: 'row',
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.md,
  },
  toggleItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  toggleItemActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.textSecondary, fontSize: typography.caption.fontSize + 1, fontWeight: '600' },
  toggleTextActive: { color: colors.textPrimary },
  potm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  potmText: { flex: 1 },
  potmLabel: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  potmName: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '700' },
  potmXp: { color: STAR_COLOR, fontSize: typography.caption.fontSize + 1, fontWeight: '700' },
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
  rankCol: { width: 24, alignItems: 'center' },
  medal: { fontSize: 18 },
  rankNum: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '700' },
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
  // Mockup 03: small colored position pill right of the name.
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
  // one glassy segment per category, tinted by the grade color scale.
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
