import { useTranslation } from 'react-i18next'
import { Modal } from '../../../components/shared/Modal'
import type { MatchLineupDto } from '../../../types/domain.types'
import { SLOT_POSITION_LABELS, SLOT_POSITION_NAMES } from '../../../types/domain.types'
import { colorClasses, rosterDisplayName, rosterShortName } from '../lineupUtils'

export type PickerScope = { kind: 'all' } | { kind: 'formation'; formationIndex: number }

interface Props {
  open: boolean
  onClose: () => void
  lineup: MatchLineupDto
  rosterId: number | null
  scope: PickerScope
  /** When set, this slot is highlighted as the player's current slot and not selectable. */
  currentSlot?: { formationIndex: number; slotId: number }
  onPick: (formationIndex: number, slotId: number) => void
}

export function PositionPickerModal({
  open,
  onClose,
  lineup,
  rosterId,
  scope,
  currentSlot,
  onPick,
}: Props) {
  const { t } = useTranslation()
  if (!open || rosterId === null) return null
  const roster = lineup.roster.find((r) => r.id === rosterId)
  if (!roster) return null

  const formations =
    scope.kind === 'all'
      ? lineup.formations.slice().sort((a, b) => a.index - b.index)
      : lineup.formations.filter((f) => f.index === scope.formationIndex)

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t('lineups.positionFor', { name: rosterDisplayName(roster) })}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {formations.length === 0 ? (
          <p className="text-sm text-gray-500">{t('lineups.noFormationAvailable')}</p>
        ) : (
          formations.map((f) => {
            const c = colorClasses(f.colorKey)
            return (
              <div key={f.index}>
                <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${c.text}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  {t('lineups.formation')} {f.index}
                  {f.label ? ` · ${f.label}` : ''}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {f.slots.map((s) => {
                    const occupant = s.rosterId
                      ? lineup.roster.find((r) => r.id === s.rosterId)
                      : null
                    const isCurrent =
                      !!currentSlot &&
                      currentSlot.formationIndex === f.index &&
                      currentSlot.slotId === s.id
                    return (
                      <button
                        type="button"
                        key={s.id}
                        disabled={isCurrent}
                        onClick={() => {
                          onPick(f.index, s.id)
                          onClose()
                        }}
                        className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
                          isCurrent
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            : 'border-gray-200 bg-white hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              isCurrent ? 'bg-gray-200 text-gray-500' : `${c.bg} text-white`
                            }`}
                          >
                            {SLOT_POSITION_LABELS[s.position]}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {SLOT_POSITION_NAMES[s.position]}
                          </span>
                        </span>
                        <span
                          className={`truncate text-xs ${
                            isCurrent
                              ? 'text-gray-400'
                              : occupant
                                ? 'text-amber-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {isCurrent
                            ? t('lineups.currentPosition')
                            : occupant
                              ? t('lineups.willOverwrite', { name: rosterShortName(occupant) })
                              : t('lineups.free')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
