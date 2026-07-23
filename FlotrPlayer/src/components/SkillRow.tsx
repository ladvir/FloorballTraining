import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GradeBadge } from './GradeBadge'
import { t } from '../i18n/strings'
import { colors } from '../theme/tokens'
import type { PlayerSkillDto } from '../types/domain.types'

// One skill card in the list (spec section 10): name, colored grade badge, short
// recommendation - read-only in this etapa, tapping opens the full detail (section 11).
export function SkillRow({ skill, onPress }: { skill: PlayerSkillDto; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <GradeBadge grade={skill.grade} size={40} />
      <View style={styles.info}>
        <Text style={styles.name}>{skill.name}</Text>
        <Text style={styles.recommendation} numberOfLines={1}>
          {skill.recommendation || t('skills.noRecommendation')}
        </Text>
      </View>
    </Pressable>
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
