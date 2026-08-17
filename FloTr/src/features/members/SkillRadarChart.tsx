import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent } from '../../components/ui/Card'
import type { PlayerSkillCategoryDto } from '../../types/domain.types'
import type { PendingEdit } from './SkillDetailModal'
import { buildRadarData } from './skillRadar'

interface Props {
  categories: PlayerSkillCategoryDto[]
  pending: Record<number, PendingEdit>
}

/** Category overview radar (spec section 12) — inverted scale (6 - grade) so a bigger area
 * means better performance; the real average grade is shown in the tooltip, not the axis. */
export function SkillRadarChart({ categories, pending }: Props) {
  const { t } = useTranslation()

  const data = useMemo(() => buildRadarData(categories, pending), [categories, pending])

  const hasData = data.some((d) => d.avg != null)

  return (
    <Card>
      <CardContent className="py-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('playerSkills.radarTitle')}</h3>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-gray-500">{t('playerSkills.noRatingsYet')}</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} />
                <PolarRadiusAxis domain={[1, 5]} tick={false} axisLine={false} />
                <Radar dataKey="inverted" stroke="#0284c7" fill="#0284c7" fillOpacity={0.35} />
                <Tooltip
                  formatter={(_value, _name, item) => {
                    const avg = (item.payload as { avg?: number | null } | undefined)?.avg
                    return [avg != null ? avg.toFixed(1) : '–', t('playerSkills.avgGrade')]
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
