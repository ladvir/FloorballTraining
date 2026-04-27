import type { LineupRosterDto, MatchLineupDto, SlotPosition } from '../../types/domain.types'

export type LineupAction =
  | { type: 'init'; lineup: MatchLineupDto }
  | { type: 'setName'; name: string }
  | { type: 'setAppointmentId'; id: number | null }
  | { type: 'setIsShared'; value: boolean }
  | { type: 'setFormationCount'; count: number }
  | { type: 'setTemplate'; templateId: number; slots: SlotPosition[] }
  | { type: 'addRoster'; roster: LineupRosterDto }
  | { type: 'removeRoster'; rosterId: number }
  | { type: 'toggleAvailable'; rosterId: number }
  | { type: 'reorderRoster'; orderedIds: number[] }
  | { type: 'assignSlot'; formationIndex: number; slotId: number; rosterId: number | null }
  | { type: 'swapSlot'; formationIndex: number; slotIdA: number; slotIdB: number }
  | { type: 'setFormationLabel'; formationIndex: number; label: string }
