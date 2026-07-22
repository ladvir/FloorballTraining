import { t } from '../i18n/strings'
import type { PlayerPosition } from '../types/domain.types'

export const positionLabel = (position: PlayerPosition): string => {
  switch (position) {
    case 'FieldPlayer':
      return t('position.fieldPlayer')
    case 'Goalkeeper':
      return t('position.goalkeeper')
    case 'Both':
      return t('position.both')
  }
}
