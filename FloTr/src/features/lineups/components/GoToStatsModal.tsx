import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../../components/shared/Modal'
import { Button } from '../../../components/ui/Button'
import { lineupsApi, statTrackersApi } from '../../../api/index'
import { AppointmentFormModal } from '../../appointments/AppointmentFormModal'
import type { AppointmentDto, MatchLineupDto } from '../../../types/domain.types'

interface Props {
  open: boolean
  onClose: () => void
  lineup: MatchLineupDto
  /** Future training/match appointments for the lineup's team. */
  futureEvents: AppointmentDto[]
}

export function GoToStatsModal({ open, onClose, lineup, futureEvents }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [creatingEvent, setCreatingEvent] = useState(false)

  // Re-decide the default view each time the modal opens, without an effect (React docs'
  // recommended "adjust state during render" pattern - avoids a cascading-render lint error).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setCreatingEvent(futureEvents.length === 0)
  }

  // Attach the lineup to the chosen event, then reuse or create its stat tracker.
  const startMutation = useMutation({
    mutationFn: async (apt: { id: number; appointmentType?: number }) => {
      const existing = await lineupsApi.getByAppointment(apt.id)
      if (existing && existing.id !== lineup.id) {
        await lineupsApi.update(existing.id, { ...existing, appointmentId: null })
      }
      await lineupsApi.update(lineup.id, { ...lineup, appointmentId: apt.id })

      const eventCategory = apt.appointmentType === 0 ? 1 : 0
      const trackers = await statTrackersApi.getForEvent({
        type: 'appointment',
        id: apt.id,
        teamId: lineup.teamId,
      })
      return (
        trackers[0] ??
        (await statTrackersApi.create({
          eventCategory,
          appointmentId: apt.id,
          teamId: lineup.teamId,
        }))
      )
    },
    onSuccess: (tracker) => {
      qc.invalidateQueries({ queryKey: ['lineup', lineup.id] })
      qc.invalidateQueries({ queryKey: ['lineups', 'team', lineup.teamId] })
      navigate(`/stats/${tracker.id}/setup`)
    },
  })

  if (creatingEvent) {
    return (
      <AppointmentFormModal
        isOpen={open}
        onClose={onClose}
        defaultTeamId={lineup.teamId}
        defaultAppointmentType={3}
        defaultDate={new Date()}
        onCreated={(id, appointmentType) => startMutation.mutate({ id, appointmentType })}
      />
    )
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={t('lineups.goToStats')} maxWidth="sm">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{t('lineups.selectEventForStats')}</p>
        <div className="space-y-1.5">
          {futureEvents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => startMutation.mutate({ id: a.id, appointmentType: a.appointmentType })}
              disabled={startMutation.isPending}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
            >
              <span className="font-medium text-gray-900">
                {a.name ||
                  (a.appointmentType === 0
                    ? t('appointments.typeTraining')
                    : t('appointments.typeMatch'))}
              </span>
              <span className="text-xs text-gray-500">
                {format(parseISO(a.start), 'd.M.yyyy HH:mm')}
              </span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setCreatingEvent(true)}>
          {t('appointments.newEvent')}
        </Button>
      </div>
    </Modal>
  )
}
