import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'

interface PublicAppointment {
  id: number
  name?: string
  start: string
  end: string
  locationName?: string
  appointmentType: number
}

export function PublicCalendarPage() {
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const [appointments, setAppointments] = useState<PublicAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const typeLabels: Record<number, string> = {
    0: t('appointments.typeTraining'),
    1: t('appointments.typeCamp'),
    2: t('appointments.typePromotion'),
    3: t('appointments.typeMatch'),
    4: t('appointments.typeOther'),
    5: t('appointments.typeWorkshop'),
    6: t('appointments.typeOrganizing'),
    7: t('appointments.typePreperation'),
  }

  useEffect(() => {
    if (!token) return
    axios
      .get<PublicAppointment[]>(`/api/public/calendar/${token}`)
      .then((r) => {
        setAppointments(r.data)
        setLoading(false)
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ??
          (err?.response?.status === 404 ? t('errors.404Desc') : t('errors.networkDesc'))
        setError(msg)
        setLoading(false)
      })
  }, [token, t])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">FloTr</h1>
          <p className="mt-1 text-sm text-gray-500">{t('teams.publicCalendar')}</p>
        </div>

        {appointments && appointments.length === 0 ? (
          <p className="text-center text-gray-500">{t('dashboard.noUpcomingEvents')}</p>
        ) : (
          <div className="space-y-3">
            {appointments?.map((apt) => {
              const start = parseISO(apt.start)
              const end = parseISO(apt.end)
              return (
                <div
                  key={apt.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                      <span className="text-xl font-bold leading-none">{format(start, 'd')}</span>
                      <span className="text-[10px] uppercase leading-none">
                        {format(start, 'MMM', { locale: dfLocale() })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {apt.name || typeLabels[apt.appointmentType] || t('common.unknown')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(start, 'EEEE d. M. yyyy', { locale: dfLocale() })}{' '}
                        {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
                      </p>
                      {apt.locationName && (
                        <p className="text-xs text-gray-400 mt-0.5">{apt.locationName}</p>
                      )}
                      <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {typeLabels[apt.appointmentType] || t('common.unknown')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">{t('landing.subtitle')}</p>
      </div>
    </div>
  )
}
