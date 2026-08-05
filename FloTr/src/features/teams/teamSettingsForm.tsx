import type { ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import type { AgeGroupDto, SeasonDto } from '../../types/domain.types'
import type { TeamFormData } from './teamSettingsSchema'

// Shared team settings form fields, used by both the create page (TeamFormPage) and the
// edit-in-place modal (TeamSettingsModal) so the form lives in exactly one place.
export function TeamSettingsFields({
  t,
  register,
  errors,
  ageGroups,
  seasons,
  iCalImportSlot,
}: {
  t: (k: string, o?: Record<string, unknown>) => string
  register: UseFormRegister<TeamFormData>
  errors: FieldErrors<TeamFormData>
  ageGroups?: AgeGroupDto[]
  seasons?: SeasonDto[]
  /** Edit-only iCal import button + result, rendered under the iCal URL field. */
  iCalImportSlot?: ReactNode
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-4 py-4">
          <Input
            label={t('teams.formName')}
            placeholder={t('teams.namePlaceholderJuniorsA')}
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('teams.formAgeGroup')}
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.ageGroupId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
              {...register('ageGroupId')}
            >
              <option value={0}>{t('teams.selectPlaceholder')}</option>
              {ageGroups?.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
            {errors.ageGroupId && (
              <p className="mt-1 text-xs text-red-500">{errors.ageGroupId.message}</p>
            )}
          </div>

          <input type="hidden" {...register('clubId')} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('teams.formSeason')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              {...register('seasonId')}
            >
              <option value="">{t('teams.noSeason')}</option>
              {seasons?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <p className="text-sm font-medium text-gray-700">{t('teams.trainingSettings')}</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('teams.playersMin')}
              type="number"
              min={1}
              max={100}
              placeholder={t('activities.egValue', { n: 8 })}
              error={errors.personsMin?.message}
              {...register('personsMin')}
            />
            <Input
              label={t('teams.playersMax')}
              type="number"
              min={1}
              max={100}
              placeholder={t('activities.egValue', { n: 20 })}
              error={errors.personsMax?.message}
              {...register('personsMax')}
            />
          </div>
          <Input
            label={t('teams.defaultDuration')}
            type="number"
            min={1}
            max={240}
            placeholder={t('activities.egValue', { n: 90 })}
            error={errors.defaultTrainingDuration?.message}
            {...register('defaultTrainingDuration')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('teams.formMaxDuration')}
              type="number"
              min={1}
              max={240}
              placeholder={t('teams.maxDurationPlaceholder')}
              error={errors.maxTrainingDuration?.message}
              {...register('maxTrainingDuration')}
            />
            <Input
              label={t('teams.formMaxPartDuration')}
              type="number"
              min={1}
              max={120}
              placeholder={t('teams.maxPartDurationPlaceholder')}
              error={errors.maxTrainingPartDuration?.message}
              {...register('maxTrainingPartDuration')}
            />
          </div>
          <Input
            label={t('teams.formMinPartsPct')}
            type="number"
            min={1}
            max={100}
            placeholder={t('teams.defaultMinPartsPctPlaceholder')}
            error={errors.minPartsDurationPercent?.message}
            {...register('minPartsDurationPercent')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <p className="text-sm font-medium text-gray-700">{t('teams.calendarIcal')}</p>
          <Input
            label={t('teams.icalUrl')}
            placeholder="https://example.com/calendar.ics"
            error={errors.iCalUrl?.message}
            {...register('iCalUrl')}
          />
          {iCalImportSlot}
        </CardContent>
      </Card>
    </>
  )
}
