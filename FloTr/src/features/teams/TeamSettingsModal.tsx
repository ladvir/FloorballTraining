import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Check, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { teamsApi, ageGroupsApi, seasonsApi } from '../../api/index'
import type { ICalImportResult } from '../../api/index'
import type { TeamDto } from '../../types/domain.types'
import { TeamSettingsFields } from './teamSettingsForm'
import { buildTeamSchema, type TeamFormData } from './teamSettingsSchema'

/** Edit an existing team's settings in place (used by the merged team detail page). HeadCoach+ only. */
export function TeamSettingsModal({
  team,
  isOpen,
  onClose,
  canManage,
}: {
  team: TeamDto
  isOpen: boolean
  onClose: () => void
  canManage: boolean
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ICalImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const { data: ageGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: seasons } = useQuery({
    queryKey: ['seasons', team.clubId],
    queryFn: () => seasonsApi.getAll(team.clubId),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(buildTeamSchema(t)) as any,
  })

  useEffect(() => {
    if (!isOpen) return
    reset({
      name: team.name,
      ageGroupId: team.ageGroupId ?? 0,
      clubId: team.clubId ?? 0,
      seasonId: team.seasonId ?? '',
      personsMin: team.personsMin ?? '',
      personsMax: team.personsMax ?? '',
      defaultTrainingDuration: team.defaultTrainingDuration ?? '',
      maxTrainingDuration: team.maxTrainingDuration ?? '',
      maxTrainingPartDuration: team.maxTrainingPartDuration ?? '',
      minPartsDurationPercent: team.minPartsDurationPercent ?? '',
      iCalUrl: team.iCalUrl ?? '',
    })
  }, [isOpen, team, reset])

  const mutation = useMutation({
    mutationFn: (data: TeamFormData) => {
      const ageGroup = ageGroups?.find((a) => a.id === Number(data.ageGroupId))
      return teamsApi.update({
        id: team.id,
        name: data.name,
        ageGroupId: Number(data.ageGroupId),
        ageGroup: ageGroup ?? { id: Number(data.ageGroupId), name: '', description: '' },
        clubId: Number(data.clubId),
        seasonId: data.seasonId !== '' ? Number(data.seasonId) : null,
        personsMin: data.personsMin !== '' ? Number(data.personsMin) : undefined,
        personsMax: data.personsMax !== '' ? Number(data.personsMax) : undefined,
        defaultTrainingDuration:
          data.defaultTrainingDuration !== '' ? Number(data.defaultTrainingDuration) : undefined,
        maxTrainingDuration:
          data.maxTrainingDuration !== '' ? Number(data.maxTrainingDuration) : undefined,
        maxTrainingPartDuration:
          data.maxTrainingPartDuration !== '' ? Number(data.maxTrainingPartDuration) : undefined,
        minPartsDurationPercent:
          data.minPartsDurationPercent !== '' ? Number(data.minPartsDurationPercent) : undefined,
        iCalUrl: data.iCalUrl || undefined,
        appointments: [],
        teamMembers: [],
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team'] })
      onClose()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })
        ?.response?.data
      setSaveError(data?.errors?.join(', ') ?? data?.message ?? t('teams.saveFailed'))
    },
  })

  const importMutation = useMutation({
    mutationFn: () => teamsApi.importICal(team.id),
    onSuccess: (data) => {
      setImportResult(data)
      setImportError(null)
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setImportError(data?.message ?? t('teams.importFailed'))
      setImportResult(null)
    },
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('teams.settingsTitle')} maxWidth="2xl">
      <form
        onSubmit={handleSubmit((data) => {
          setSaveError(null)
          mutation.mutate(data)
        })}
        className="space-y-4"
      >
        <fieldset disabled={!canManage} className="m-0 space-y-4 border-0 p-0">
          <TeamSettingsFields
            t={t}
            register={register}
            errors={errors}
            ageGroups={ageGroups}
            seasons={seasons}
            iCalImportSlot={
              team.iCalUrl ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportResult(null)
                      setImportError(null)
                      importMutation.mutate()
                    }}
                    loading={importMutation.isPending}
                  >
                    <Calendar className="mr-1.5 h-4 w-4" />
                    {t('appointments.importIcal')}
                  </Button>
                  {importResult && (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        {t('teams.importDone', {
                          imported: importResult.imported,
                          updated: importResult.updated,
                          skipped: importResult.skipped,
                        })}
                        {importResult.errors.length > 0 && (
                          <span className="block text-orange-600 mt-1">
                            {importResult.errors.join('; ')}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {importError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              ) : undefined
            }
          />
        </fieldset>

        {saveError && canManage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {canManage ? t('common.cancel') : t('common.close')}
          </Button>
          {canManage && (
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {t('common.save')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
