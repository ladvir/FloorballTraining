import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { xpApi } from '../../api/index'
import { dfLocale } from '../../utils/dateLocale'

/** XP ledger filterable by month — "how much XP, and for what" for a given month (vs. lifetime XpBreakdown). */
export function XpHistory({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const { data } = useQuery({
    queryKey: ['xp-history', memberId],
    queryFn: () => xpApi.getHistory(memberId),
    enabled: Number.isFinite(memberId),
  })

  const monthEvents = useMemo(
    () => (data ?? []).filter((e) => format(parseISO(e.occurredAt), 'yyyy-MM') === month),
    [data, month]
  )

  const rows = useMemo(() => {
    const byType = new Map<string, number>()
    for (const e of monthEvents) byType.set(e.type, (byType.get(e.type) ?? 0) + e.points)
    return [...byType.entries()].map(([type, xp]) => ({ type, xp })).sort((a, b) => b.xp - a.xp)
  }, [monthEvents])

  const total = rows.reduce((sum, r) => sum + r.xp, 0)

  const detailItems = useMemo(
    () =>
      monthEvents
        .filter((e) => e.type === expandedType)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [monthEvents, expandedType]
  )

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-700">{t('xp.history.title')}</p>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            aria-label={t('xp.history.month')}
          />
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">{t('xp.history.empty')}</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((r) => {
              const isOpen = expandedType === r.type
              return (
                <li key={r.type}>
                  <button
                    type="button"
                    onClick={() => setExpandedType(isOpen ? null : r.type)}
                    className="flex w-full items-center justify-between rounded-md py-1 text-sm hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-1 text-gray-600">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      {t(`xp.type.${r.type}`, { defaultValue: r.type })}
                    </span>
                    <span className="font-medium text-gray-900">
                      {t('xp.xpTotal', { xp: r.xp })}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="ml-5 space-y-1 border-l border-gray-100 pl-3">
                      {detailItems.map((e, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between py-0.5 text-xs text-gray-500"
                        >
                          <span>{t(`xp.type.${e.type}`, { defaultValue: e.type })}</span>
                          <span>
                            {format(parseISO(e.occurredAt), 'd. M. yyyy', { locale: dfLocale() })}
                          </span>
                          <span className="font-medium text-gray-700">
                            {t('xp.xpTotal', { xp: e.points })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
            <li className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
              <span className="text-gray-700">{t('common.total')}</span>
              <span className="text-gray-900">{t('xp.xpTotal', { xp: total })}</span>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
