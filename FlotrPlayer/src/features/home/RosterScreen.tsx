import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { PickerModal } from '../../components/PickerModal'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'
import type { MemberTeamRole, PlayerPosition, PlayerSkillRosterMemberDto } from '../../types/domain.types'
import { positionLabel } from '../../utils/position'
import { teamRoleLabel } from '../../utils/teamRole'

type ActiveFilter = 'team' | 'year' | 'position' | 'role' | null

interface RosterScreenProps {
  /** Shown when this screen is pushed as a stack route rather than a tab root - the Hráč's
   * "Režim prohlížení" entry (ProfileScreen) needs a way back; the Trenér's Roster tab doesn't. */
  showBackButton?: boolean
}

// Seznam a prohlížení hráčů klubu (spec section 15, issues #84+#85): roster dostupný dle
// GET /playerskills/roster (od #85 i pro účet Hráč jako "Režim prohlížení"), s živým
// vyhledáváním a filtry Tým/Ročník/Pozice. Výběr hráče otevře jeho kartičku (CardDetailScreen)
// s navigací swipe/šipkami v rámci právě zobrazeného (filtrovaného) seznamu.
export function RosterScreen({ showBackButton }: RosterScreenProps = {}) {
  const navigation = useNavigation()
  const { data: roster, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'roster'],
    queryFn: playerSkillsApi.getRoster,
  })

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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('roster.loadError')}</Text>
        <Button title={t('common.retry')} onPress={() => refetch()} loading={isRefetching} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {showBackButton && (
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ {t('roster.back')}</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{t('roster.title')}</Text>

      <TextInput
        style={styles.search}
        placeholder={t('roster.searchPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <View style={styles.filterRow}>
        <FilterChip label={t('roster.filterTeam')} value={team} onPress={() => setActiveFilter('team')} />
        <FilterChip label={t('roster.filterYear')} value={year} onPress={() => setActiveFilter('year')} />
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
        <Text style={styles.emptyText}>{t('roster.empty')}</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>{t('roster.noResults')}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.memberId)}
          renderItem={({ item }) => <RosterRow member={item} onPress={() => openMember(item.memberId)} />}
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
  )
}

function FilterChip({ label, value, onPress }: { label: string; value: string | number | null; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{value ?? label}</Text>
    </Pressable>
  )
}

function RosterRow({ member, onPress }: { member: PlayerSkillRosterMemberDto; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar firstName={member.firstName} lastName={member.lastName} size={44} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>
          {member.firstName} {member.lastName}
        </Text>
        <Text style={styles.rowMeta}>
          {member.teams.join(', ')} · {member.birthYear} · {positionLabel(member.position)}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 4,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  search: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  clearFilters: {
    color: colors.accent,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  list: {
    gap: 10,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 16,
    padding: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
})
