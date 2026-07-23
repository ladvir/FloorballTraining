import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GradeBadge } from './GradeBadge'
import { t } from '../i18n/strings'
import { colors } from '../theme/tokens'
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
// read-only unless `editable`, tapping the name/recommendation always opens the full detail (section 11).
export function SkillRow({ skill, onPress, editable, onGradePress }: SkillRowProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={editable ? onGradePress : onPress} hitSlop={8}>
        <GradeBadge grade={skill.grade} size={40} />
      </Pressable>
      <Pressable style={styles.info} onPress={onPress}>
        <Text style={styles.name}>{skill.name}</Text>
        <Text style={styles.recommendation} numberOfLines={1}>
          {skill.recommendation || t('skills.noRecommendation')}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 16,
    padding: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  recommendation: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
})
