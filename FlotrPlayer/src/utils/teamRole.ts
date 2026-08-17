import { t } from '../i18n/strings'
import type { MemberTeamRole } from '../types/domain.types'

export const teamRoleLabel = (role: MemberTeamRole): string => {
  switch (role) {
    case 'Player':
      return t('role.player')
    case 'PlayerCoach':
      return t('role.playerCoach')
  }
}
