import { StyleSheet, Text, View } from 'react-native'
import { t } from '../i18n/strings'
import { colors } from '../theme/tokens'
import { positionLabel } from '../utils/position'
import { teamRoleLabel } from '../utils/teamRole'
import type { PlayerSkillCardDto } from '../types/domain.types'

// Spec section 15: a Hráč account browsing a teammate's card must see this clearly labeled
// at the top, plus club/team/position/role - so it's never mistaken for their own card.
export function BrowseModeBanner({ card }: { card: PlayerSkillCardDto }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.label}>{t('roster.browseModeBanner')}</Text>
      <Text style={styles.meta}>
        {card.clubName}
        {card.teams.length > 0 ? ` · ${card.teams.join(', ')}` : ''} · {positionLabel(card.position)} ·{' '}
        {teamRoleLabel(card.teamRole)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: colors.gradientEnd,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
})
