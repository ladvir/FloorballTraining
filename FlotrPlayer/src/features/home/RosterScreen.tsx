import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { PickerModal } from '../../components/PickerModal'
import { playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors } from '../../theme/tokens'
import type { PlayerPosition, PlayerSkillRosterMemberDto } from '../../types/domain.types'
import { positionLabel } from '../../utils/position'

type ActiveFilter = 'team' | 'year' | 'position' | null

// Domovská obrazovka pro účet Trenér (spec section 7 + 14/15, issue #84): roster svěřenců
// dostupných dle GET /playerskills/roster, s živým vyhledáváním a filtry Tým/Ročník/Pozice.
export function RosterScreen() {
  const { data: roster, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['playerskills', 'roster'],
    queryFn: playerSkillsApi.getRoster,
  })

  const [search, setSearch] = useState('')
  const [team, setTeam] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [position, setPosition] = useState<PlayerPosition | null>(null)
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (roster ?? []).filter((m) => {
      if (query && !`${m.firstName} ${m.lastName}`.toLowerCase().includes(query)) return false
      if (team && !m.teams.includes(team)) return false
      if (year && m.birthYear !== year) return false
      if (position && m.position !== position) return false
      return true
    })
  }, [roster, search, team, year, position])

  const hasActiveFilters = Boolean(search || team || year || position)

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
      </View>

      {hasActiveFilters && (
        <Pressable
          onPress={() => {
            setSearch('')
            setTeam(null)
            setYear(null)
            setPosition(null)
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
          renderItem={({ item }) => <RosterRow member={item} />}
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

function RosterRow({ member }: { member: PlayerSkillRosterMemberDto }) {
  return (
    <View style={styles.row}>
      <Avatar firstName={member.firstName} lastName={member.lastName} size={44} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>
          {member.firstName} {member.lastName}
        </Text>
        <Text style={styles.rowMeta}>
          {member.teams.join(', ')} · {member.birthYear} · {positionLabel(member.position)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
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
