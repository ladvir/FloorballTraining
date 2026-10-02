import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Check, Upload } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { attendanceImportApi } from '../../api/attendanceImport.api'
import { membersApi } from '../../api/index'
import type {
  AttendanceImportAnalyzeResultDto,
  AttendanceImportCommitRequestDto,
  AttendanceImportCommitResultDto,
  AttendanceImportEventDto,
  AttendanceImportMemberAction,
  AttendanceImportMemberRowDto,
  MemberDto,
} from '../../types/domain.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  teamId: number
  clubId?: number
}

interface MemberRowState {
  row: AttendanceImportMemberRowDto
  action: AttendanceImportMemberAction
  memberId?: number
  newFirstName: string
  newLastName: string
}

// What to do about the event itself: pair to an existing appointment (auto-matched or picked),
// create a brand-new one from the Excel data, or skip the whole event.
type EventChoice =
  | { kind: 'existing'; appointmentId: number; synced: boolean }
  | { kind: 'new' }
  | { kind: 'skip' }

interface EventRowState {
  source: AttendanceImportEventDto
  choice: EventChoice
  updateAllExistingAttendance: boolean
  members: MemberRowState[]
}

// Mirrors the backend's SplitMemberName: EOS names are "Příjmení Jméno" — last word = first name.
function splitName(nameRaw: string) {
  const parts = nameRaw.split(' ').filter(Boolean)
  if (parts.length < 2) return { firstName: '', lastName: nameRaw }
  return { firstName: parts[parts.length - 1], lastName: parts.slice(0, -1).join(' ') }
}

function initMember(row: AttendanceImportMemberRowDto): MemberRowState {
  const { firstName, lastName } = splitName(row.nameRaw)
  const preselectedId = row.matchedMemberId ?? row.suggestedClubMemberId
  return {
    row,
    action: preselectedId ? 1 : 0,
    memberId: preselectedId,
    newFirstName: firstName,
    newLastName: lastName,
  }
}

function initEvents(result: AttendanceImportAnalyzeResultDto): EventRowState[] {
  return result.events.map((source) => {
    const choice: EventChoice =
      source.matchedAppointmentId != null
        ? { kind: 'existing', appointmentId: source.matchedAppointmentId, synced: false }
        : // Nothing found at all for this day — suggest creating the event rather than a silent skip.
          source.candidateAppointments.length === 0
          ? { kind: 'new' }
          : { kind: 'skip' }
    return {
      source,
      choice,
      updateAllExistingAttendance: false,
      members: source.members.map(initMember),
    }
  })
}

function buildCommitRequest(events: EventRowState[]): AttendanceImportCommitRequestDto {
  return {
    events: events.map((e) => {
      const resolved = e.choice.kind !== 'skip'
      return {
        appointmentId: e.choice.kind === 'existing' ? e.choice.appointmentId : undefined,
        syncAppointmentFromImport: e.choice.kind === 'existing' && e.choice.synced,
        createNewAppointment: e.choice.kind === 'new',
        eventTypeRaw: e.source.eventTypeRaw,
        eventName: e.source.eventName,
        start: e.source.start,
        end: e.source.end,
        updateAllExistingAttendance: e.updateAllExistingAttendance,
        members: resolved
          ? e.members.map((m) => ({
              nameRaw: m.row.nameRaw,
              attended: m.row.attended,
              action: m.action,
              memberId: m.action === 1 ? m.memberId : undefined,
              newFirstName: m.action === 2 ? m.newFirstName : undefined,
              newLastName: m.action === 2 ? m.newLastName : undefined,
            }))
          : [],
      }
    }),
  }
}

export function AttendanceImportModal({ isOpen, onClose, teamId, clubId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [events, setEvents] = useState<EventRowState[] | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [commitResult, setCommitResult] = useState<AttendanceImportCommitResultDto | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  const { data: clubMembers } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
    enabled: isOpen,
  })
  const pickableMembers = (clubMembers ?? []).filter((m) => !clubId || m.clubId === clubId)

  const analyzeMutation = useMutation({
    mutationFn: () => attendanceImportApi.analyze(teamId, file!),
    onSuccess: (data) => {
      setEvents(initEvents(data))
      setParseErrors(data.parseErrors)
      setAnalyzeError(null)
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setAnalyzeError(data?.message ?? t('attendanceImport.analyzeFailed'))
    },
  })

  const commitMutation = useMutation({
    mutationFn: () => attendanceImportApi.commit(teamId, buildCommitRequest(events!)),
    onSuccess: (data) => {
      setCommitResult(data)
      setCommitError(null)
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'team', teamId] })
      void queryClient.invalidateQueries({ queryKey: ['team', String(teamId)] })
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      void queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setCommitError(data?.message ?? t('attendanceImport.commitFailed'))
    },
  })

  const handleClose = () => {
    setFile(null)
    setAnalyzeError(null)
    setEvents(null)
    setParseErrors([])
    setCommitResult(null)
    setCommitError(null)
    onClose()
  }

  const updateEvent = (eventIdx: number, patch: Partial<EventRowState>) => {
    setEvents((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[eventIdx] = { ...next[eventIdx], ...patch }
      return next
    })
  }

  const updateMember = (eventIdx: number, memberIdx: number, patch: Partial<MemberRowState>) => {
    setEvents((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const members = [...next[eventIdx].members]
      members[memberIdx] = { ...members[memberIdx], ...patch }
      next[eventIdx] = { ...next[eventIdx], members }
      return next
    })
  }

  const handleAppointmentSelect = (eventIdx: number, value: string) => {
    const choice: EventChoice =
      value === ''
        ? { kind: 'skip' }
        : value === 'new'
          ? { kind: 'new' }
          : { kind: 'existing', appointmentId: Number(value), synced: true }
    updateEvent(eventIdx, { choice })
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('attendanceImport.title')} maxWidth="2xl">
      <div className="space-y-4">
        {!events && !commitResult && (
          <>
            <p className="text-sm text-gray-600">{t('attendanceImport.description')}</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
            />
            {analyzeError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{analyzeError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!file}
                loading={analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate()}
              >
                <Upload className="h-4 w-4" />
                {t('attendanceImport.analyze')}
              </Button>
            </div>
          </>
        )}

        {events && !commitResult && (
          <>
            {parseErrors.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">
                <p className="font-medium mb-1">{t('attendanceImport.parseErrorsTitle')}</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {parseErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {t('attendanceImport.noEvents')}
              </p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {events.map((e, eventIdx) => {
                  const source = e.source
                  const isAutoMatched = source.matchedAppointmentId != null
                  const needsPick = !isAutoMatched
                  const decisionMembers = e.members.filter((m) => !m.row.matchedMemberId)
                  const resolvedCount = e.members.length - decisionMembers.length
                  const conflictCount = e.members.filter((m) => m.row.existing).length
                  const eventResolved = e.choice.kind !== 'skip'

                  return (
                    <div key={eventIdx} className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {format(parseISO(source.start), 'd. M. yyyy HH:mm')}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {source.eventTypeRaw}
                            {source.eventName ? ` · ${source.eventName}` : ''}
                          </span>
                        </div>
                        {isAutoMatched && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <Check className="h-3.5 w-3.5" />
                            {source.matchedAppointmentName || t('attendanceImport.matchedEvent')}
                          </span>
                        )}
                      </div>

                      {needsPick && (
                        <select
                          value={
                            e.choice.kind === 'existing'
                              ? e.choice.appointmentId
                              : e.choice.kind === 'new'
                                ? 'new'
                                : ''
                          }
                          onChange={(ev) => handleAppointmentSelect(eventIdx, ev.target.value)}
                          className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">{t('attendanceImport.skipEvent')}</option>
                          <option value="new">{t('attendanceImport.createEvent')}</option>
                          {source.candidateAppointments.map((c) => (
                            <option key={c.id} value={c.id}>
                              {format(parseISO(c.start), 'HH:mm')} —{' '}
                              {c.name || t('attendanceImport.unnamedEvent')}
                            </option>
                          ))}
                        </select>
                      )}
                      {needsPick && source.candidateAppointments.length === 0 && (
                        <p className="mb-2 text-xs italic text-gray-400">
                          {t('attendanceImport.noEventFound')}
                        </p>
                      )}

                      {eventResolved &&
                        e.choice.kind === 'existing' &&
                        (conflictCount > 0 || e.choice.synced) && (
                          <label className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                            <input
                              type="checkbox"
                              checked={e.updateAllExistingAttendance}
                              onChange={(ev) =>
                                updateEvent(eventIdx, {
                                  updateAllExistingAttendance: ev.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                            />
                            {conflictCount > 0
                              ? t('attendanceImport.existingConflict', { count: conflictCount })
                              : t('attendanceImport.existingConflictUnknown')}
                          </label>
                        )}

                      {eventResolved && (
                        <>
                          <p className="mb-2 text-xs text-gray-500">
                            {t('attendanceImport.membersResolved', {
                              count: resolvedCount,
                              total: e.members.length,
                            })}
                          </p>
                          {decisionMembers.length > 0 && (
                            <div className="space-y-2">
                              {e.members.map((m, memberIdx) => {
                                if (m.row.matchedMemberId) return null
                                return (
                                  <MemberRow
                                    key={memberIdx}
                                    state={m}
                                    clubMembers={pickableMembers}
                                    onChange={(patch) => updateMember(eventIdx, memberIdx, patch)}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {commitError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{commitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={events.length === 0}
                loading={commitMutation.isPending}
                onClick={() => commitMutation.mutate()}
              >
                {t('attendanceImport.confirmImport')}
              </Button>
            </div>
          </>
        )}

        {commitResult && (
          <>
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {t('attendanceImport.resultSummary', {
                  created: commitResult.attendanceCreated,
                  updated: commitResult.attendanceUpdated,
                  skippedConflict: commitResult.attendanceSkippedConflict,
                  skippedByChoice: commitResult.attendanceSkippedByChoice,
                  appointmentsCreated: commitResult.appointmentsCreated,
                  appointmentsSynced: commitResult.appointmentsSynced,
                  membersCreated: commitResult.membersCreated,
                  membersAddedToTeam: commitResult.membersAddedToTeam,
                  eventsSkipped: commitResult.eventsSkipped,
                  matchEventsSkipped: commitResult.matchEventsSkipped,
                })}
                {commitResult.errors.length > 0 && (
                  <span className="mt-1 block text-orange-600">
                    {commitResult.errors.join('; ')}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleClose}>
                {t('common.close')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function MemberRow({
  state,
  clubMembers,
  onChange,
}: {
  state: MemberRowState
  clubMembers: MemberDto[]
  onChange: (patch: Partial<MemberRowState>) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">{state.row.nameRaw}</span>
        <span className={state.row.attended ? 'text-xs text-green-600' : 'text-xs text-red-500'}>
          {state.row.attended ? t('attendance.present') : t('attendance.absent')}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={state.action}
          onChange={(e) =>
            onChange({ action: Number(e.target.value) as AttendanceImportMemberAction })
          }
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value={0}>{t('attendanceImport.actionSkip')}</option>
          <option value={1}>{t('attendanceImport.actionExisting')}</option>
          <option value={2}>{t('attendanceImport.actionNew')}</option>
        </select>

        {state.action === 1 && (
          <select
            value={state.memberId ?? ''}
            onChange={(e) =>
              onChange({ memberId: e.target.value ? Number(e.target.value) : undefined })
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t('attendanceImport.pickMember')}</option>
            {clubMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.lastName} {m.firstName} ({m.birthYear})
              </option>
            ))}
          </select>
        )}

        {state.action === 2 && (
          <>
            <input
              value={state.newFirstName}
              onChange={(e) => onChange({ newFirstName: e.target.value })}
              placeholder={t('members.formFirstName')}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              value={state.newLastName}
              onChange={(e) => onChange({ newLastName: e.target.value })}
              placeholder={t('members.formLastName')}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </>
        )}
      </div>
    </div>
  )
}
