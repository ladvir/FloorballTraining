import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { xpApi } from '../../api/index'

/** "Where did my XP come from" — lifetime XP per source type. Transparent + motivational (#99). */
export function XpBreakdown({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['xp', memberId],
    queryFn: () => xpApi.getSummary(memberId),
    enabled: Number.isFinite(memberId),
  })

  const rows = data?.byType ?? []
  if (rows.length === 0) return null

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">{t('xp.breakdown')}</p>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.type} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t(`xp.type.${r.type}`, { defaultValue: r.type })}
              </span>
              <span className="font-medium text-gray-900">{t('xp.xpTotal', { xp: r.xp })}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
