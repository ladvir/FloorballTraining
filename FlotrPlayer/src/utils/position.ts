import type { Ionicons } from '@expo/vector-icons'
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

/** Card corner icon standing in for the position pill (user feedback 2026-07-24). */
export const positionIcon = (position: PlayerPosition): keyof typeof Ionicons.glyphMap => {
  switch (position) {
    case 'FieldPlayer':
      return 'walk-outline'
    case 'Goalkeeper':
      return 'hand-left-outline'
    case 'Both':
      return 'shuffle-outline'
  }
}
