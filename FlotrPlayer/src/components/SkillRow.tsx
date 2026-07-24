import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassCard } from './GlassCard'
import { GradeBadge } from './GradeBadge'
import { Icon } from './Icon'
import { t } from '../i18n/strings'
import { colors, spacing, typography } from '../theme/tokens'
import type { PlayerSkillDto } from '../types/domain.types'

interface SkillRowProps {
  skill: PlayerSkillDto
  onPress: () => void
  /** Coach's "Režim úprav" (Etapa 10, #88): makes the grade badge its own tap target that opens
   * the grade picker instead of navigating - the rest of the row still opens the detail screen. */
  editable?: boolean
  onGradePress?: () => void
}

// One skill card in the list (spec section 10): name, colored grade badge, short recommendation -
// read-only unless `editable`, tapping the name/recommendation always opens the full detail
// (section 11). Badge sits on the right per mockups 03/04 (name left, colored grade right).
export function SkillRow({ skill, onPress, editable, onGradePress }: SkillRowProps) {
  return (
    <GlassCard style={styles.row}>
      <Pressable style={styles.info} onPress={onPress}>
        <View style={styles.nameRow}>
          {skill.isFocus && <Icon name="star" size={13} color="#F59E0B" />}
          <Text style={styles.name}>{skill.name}</Text>
        </View>
        <Text style={styles.recommendation} numberOfLines={1}>
          {skill.recommendation || t('skills.noRecommendation')}
        </Text>
      </Pressable>
      <Pressable onPress={editable ? onGradePress : onPress} hitSlop={8}>
        <GradeBadge grade={skill.grade} size={40} />
      </Pressable>
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  recommendation: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
})
