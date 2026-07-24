import { useMemo, useState, type ReactNode } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native'
import { GradePickerSheet } from './GradePickerSheet'
import { IconTile } from './Icon'
import { PickerModal } from './PickerModal'
import { SkillRow } from './SkillRow'
import { t } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import type { PlayerSkillCategoryDto, PlayerSkillDto } from '../types/domain.types'
import { categoryIcon } from '../utils/categoryIcon'
import { filterSkillSections, type SkillFilterMode } from '../utils/skillFilter'

interface SkillListSectionProps {
  categories: PlayerSkillCategoryDto[]
  memberId: number
  /** Optional content rendered above the search/filter bar (e.g. the collector-card visual) -
   * shares the list's single scroll region instead of nesting a second scroll view. */
  header?: ReactNode
  /** Coach's "Režim úprav" (Etapa 10, #88): makes each row's grade badge tap open the grade
   * picker (onGradeChange) instead of navigating straight to the detail screen. */
  editable?: boolean
  onGradeChange?: (skill: PlayerSkillDto, grade: number) => void
}

// Skill list + filtering/search for the currently open card (spec sections 10 and 13). Shared by
// the Hráč's own "Dovednosti" tab and the roster/browse CardDetailScreen (#86) - one
// implementation for both contexts, same as PlayerSkillCard already does for the card itself.
export function SkillListSection({ categories, memberId, header, editable, onGradeChange }: SkillListSectionProps) {
  const navigation = useNavigation()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<SkillFilterMode>('all')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [gradeSkill, setGradeSkill] = useState<PlayerSkillDto | null>(null)

  const sections = useMemo(
    () => filterSkillSections(categories, mode, categoryId, search),
    [categories, mode, categoryId, search],
  )
  const totalSkills = categories.reduce((sum, c) => sum + c.skills.length, 0)
  const selectedCategoryName = categoryId != null ? categories.find((c) => c.categoryId === categoryId)?.name : null

  const selectMode = (next: SkillFilterMode) => {
    setMode(next)
    if (next !== 'category') setCategoryId(null)
  }

  const openSkill = (skill: PlayerSkillDto) => {
    ;(navigation as any).navigate('SkillDetail', { memberId, skill })
  }

  return (
    <>
      <SectionList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections.map((s) => ({ title: s.categoryName, data: s.skills, key: String(s.categoryId) }))}
        keyExtractor={(item) => String(item.skillId)}
        renderItem={({ item }) => (
          <SkillRow
            skill={item}
            onPress={() => openSkill(item)}
            editable={editable}
            onGradePress={() => setGradeSkill(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <IconTile name={categoryIcon(section.title)} tileSize={30} size={16} />
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        )}
        ListHeaderComponent={
          <>
            {header}
            <TextInput
              style={styles.search}
              placeholder={t('skills.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <View style={styles.filterRow}>
              <FilterChip label={t('skills.filterAll')} active={mode === 'all'} onPress={() => selectMode('all')} />
              <FilterChip
                label={t('skills.filterWeakest')}
                active={mode === 'weakest'}
                onPress={() => selectMode('weakest')}
              />
              <FilterChip
                label={t('skills.filterStrongest')}
                active={mode === 'strongest'}
                onPress={() => selectMode('strongest')}
              />
              <FilterChip
                label={selectedCategoryName ?? t('skills.filterCategory')}
                active={mode === 'category'}
                onPress={() => setCategoryPickerOpen(true)}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>{totalSkills === 0 ? t('skills.empty') : t('skills.noResults')}</Text>
        }
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
      />

      <PickerModal
        visible={categoryPickerOpen}
        title={t('skills.filterCategory')}
        options={categories.map((c) => c.categoryId)}
        selected={categoryId}
        onSelect={(value) => {
          setCategoryId(value)
          setMode(value == null ? 'all' : 'category')
        }}
        onClose={() => setCategoryPickerOpen(false)}
        formatLabel={(id) => categories.find((c) => c.categoryId === id)?.name ?? String(id)}
      />

      <GradePickerSheet
        visible={gradeSkill != null}
        value={gradeSkill?.grade ?? null}
        onSelect={(grade) => {
          if (gradeSkill) onGradeChange?.(gradeSkill, grade)
        }}
        onClose={() => setGradeSkill(null)}
      />
    </>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    // Generous fixed bottom padding (not just spacing.xl) so the list always clears the
    // floating/transparent blur tab bar (MainTabs) when used as a tab's content - harmless
    // extra scroll space in the non-tab context (CardDetailScreen).
    paddingBottom: 100,
    gap: spacing.sm + 2,
  },
  search: {
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chip: {
    backgroundColor: glass.fill,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: glass.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize + 1,
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginTop: spacing.huge,
  },
})
