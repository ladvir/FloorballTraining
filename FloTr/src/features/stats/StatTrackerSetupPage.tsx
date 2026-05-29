import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, LayoutGrid, Plus, Star, Swords, Trash2, Save } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi } from '../../api/index'
import { lineupsApi } from '../../api/lineups.api'
import { STANDARD_STAT_METRICS } from '../../types/domain.types'
import type { MatchLineupDto } from '../../types/domain.types'
import { groupLineup } from './lineupGrouping'
import { colorClasses } from '../lineups/lineupUtils'

interface MetricRow {
  code: string
  name: string
  isGoalkeeper: boolean
}

export function StatTrackerSetupPage() {
  const { trackerId } = useParams<{ trackerId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const id = Number(trackerId)

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['stat-tracker', id],
    queryFn: () => statTrackersApi.getById(id),
    enabled: !!id,
  })

  const { data: templates } = useQuery({
    queryKey: ['stat-templates', tracker?.teamId],
    queryFn: () => statTrackersApi.getTemplates(tracker!.teamId),
    enabled: !!tracker?.teamId,
  })

  const { data: teamLineups } = useQuery({
    queryKey: ['lineups', 'team', tracker?.teamId],
    queryFn: () => lineupsApi.getByTeam(tracker!.teamId),
    enabled: !!tracker?.teamId,
  })

  const [selectedLineupId, setSelectedLineupId] = useState<number | null>(null)
  const [hydratedFor, setHydratedFor] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<MetricRow[]>([])
  const [newMetric, setNewMetric] = useState('')
  const [newMetricGoalie, setNewMetricGoalie] = useState(false)
  const [opponentName, setOpponentName] = useState('')
  const [periodCount, setPeriodCount] = useState<number | null>(null)
  const [partDuration, setPartDuration] = useState<number | null>(null)

  // Auto-pick on first load: prefer the explicit lineup stored on the tracker, then appointment-linked, then most recent
  if (teamLineups && tracker && selectedLineupId === null) {
    const explicit = tracker.matchLineupId
      ? teamLineups.find((l) => l.id === tracker.matchLineupId)
      : null
    const auto =
      explicit ??
      (tracker.appointmentId
        ? teamLineups.find((l) => l.appointmentId === tracker.appointmentId)
        : null) ??
      teamLineups[0] ??
      null
    if (auto) setSelectedLineupId(auto.id)
  }

  const lineup = useMemo<MatchLineupDto | null>(() => {
    if (!teamLineups || selectedLineupId === null) return null
    return teamLineups.find((l) => l.id === selectedLineupId) ?? null
  }, [teamLineups, selectedLineupId])

  const grouping = useMemo(() => (lineup ? groupLineup(lineup) : null), [lineup])

  // Hydrate metrics + match settings once
  if (tracker && hydratedFor !== tracker.id) {
    setHydratedFor(tracker.id)
    setMetrics(
      tracker.metrics.length > 0
        ? tracker.metrics
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((m) => ({ code: m.code, name: m.name, isGoalkeeper: m.isGoalkeeper }))
        : STANDARD_STAT_METRICS.map((m) => ({ ...m }))
    )
    setOpponentName(tracker.opponentName ?? '')
    setPeriodCount(tracker.matchPeriodCount ?? null)
    setPartDuration(tracker.matchPartDurationMinutes ?? null)
  }

  // Metrics handlers
  const isMetricPicked = (code: string, name: string) =>
    metrics.some((m) => m.code === code && m.name === name)

  const toggleStandardMetric = (m: { code: string; name: string; isGoalkeeper: boolean }) => {
    if (isMetricPicked(m.code, m.name)) {
      setMetrics((prev) => prev.filter((x) => !(x.code === m.code && x.name === m.name)))
    } else {
      setMetrics((prev) => [...prev, { ...m }])
    }
  }

  const addCustomMetric = () => {
    const name = newMetric.trim()
    if (!name) return
    if (metrics.some((m) => m.name === name)) return
    setMetrics((prev) => [...prev, { code: 'custom', name, isGoalkeeper: newMetricGoalie }])
    setNewMetric('')
    setNewMetricGoalie(false)
  }

  const addTemplate = (t: { name: string; isGoalkeeper: boolean }) => {
    if (metrics.some((m) => m.name === t.name)) return
    setMetrics((prev) => [...prev, { code: 'custom', name: t.name, isGoalkeeper: t.isGoalkeeper }])
  }

  const removeMetric = (idx: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== idx))
  }

  const saveTemplateMutation = useMutation({
    mutationFn: (data: { name: string; isGoalkeeper: boolean }) =>
      statTrackersApi.createTemplate({
        teamId: tracker!.teamId,
        name: data.name,
        isGoalkeeper: data.isGoalkeeper,
        appliesTo: tracker!.eventCategory === 0 ? 'match' : 'training',
        sortOrder: (templates?.length ?? 0) + 1,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stat-templates', tracker?.teamId] }),
  })

  const removeTemplateMutation = useMutation({
    mutationFn: (templateId: number) => statTrackersApi.deleteTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stat-templates', tracker?.teamId] }),
  })

  // Save: participants are derived directly from the chosen lineup (single source of truth);
  // also persist match settings (opponent / period config) for category=0
  const setupMutation = useMutation({
    mutationFn: async () => {
      const participants =
        grouping?.all.map((p, i) => ({
          memberId: p.memberId,
          role: p.isGoalkeeper ? (1 as const) : (0 as const),
          sortOrder: i,
        })) ?? []
      await statTrackersApi.setup(id, {
        participants,
        metrics: metrics.map((m, i) => ({
          code: m.code,
          name: m.name,
          isGoalkeeper: m.isGoalkeeper,
          sortOrder: i,
        })),
        matchLineupId: selectedLineupId ?? null,
      })
      if (tracker?.eventCategory === 0) {
        return statTrackersApi.updateMatch(id, {
          opponentName: opponentName.trim() || null,
          matchPeriodCount: periodCount,
          matchPartDurationMinutes: partDuration,
          currentPeriod: tracker.currentPeriod ?? null,
        })
      }
      return statTrackersApi.getById(id)
    },
    onSuccess: (data) => {
      qc.setQueryData(['stat-tracker', id], data)
      qc.invalidateQueries({ queryKey: ['stat-tracker'] })
    },
  })

  const saveAndStart = async () => {
    await setupMutation.mutateAsync()
    navigate(`/stats/${id}/live`)
  }

  if (isLoading) return <LoadingSpinner />
  if (!tracker) return <p className="text-center text-gray-500 mt-12">Statistika nenalezena.</p>

  const eventLabel = tracker.eventName ?? (tracker.eventCategory === 1 ? 'Trénink' : 'Zápas')
  const playerCount = grouping?.all.length ?? 0
  const canSave = !!lineup && playerCount > 0 && metrics.length > 0

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nastavení statistiky"
        description={`${tracker.teamName ?? ''} • ${eventLabel}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Button>
        }
      />

      {/* Lineup selector */}
      <Card className="mb-4">
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">
              <LayoutGrid className="mr-1 inline h-4 w-4" />
              Sestava
            </h2>
            {teamLineups && teamLineups.length > 0 ? (
              <select
                value={selectedLineupId ?? ''}
                onChange={(e) =>
                  setSelectedLineupId(e.target.value ? Number(e.target.value) : null)
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">— vyber sestavu —</option>
                {teamLineups.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.appointmentId === tracker.appointmentId ? ' ★' : ''}
                  </option>
                ))}
              </select>
            ) : null}
            {lineup && (
              <button
                type="button"
                onClick={() => navigate(`/lineups/${lineup.id}/edit`)}
                className="ml-auto rounded-md px-2 py-1 text-xs text-sky-700 hover:bg-sky-50"
              >
                Upravit sestavu →
              </button>
            )}
          </div>

          {!teamLineups || teamLineups.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-medium">Tento tým zatím nemá žádnou sestavu.</p>
              <p className="mt-1 text-xs">
                Hráči se do statistiky berou výhradně ze sestavy. Vytvoř ji nejprve v sekci Sestavy.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate(`/teams/${tracker.teamId}/lineups/new`)}
              >
                Vytvořit sestavu
              </Button>
            </div>
          ) : !lineup ? (
            <p className="text-sm text-gray-500 italic">Vyber sestavu pro tuto událost.</p>
          ) : grouping && grouping.all.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Sestava neobsahuje žádné členy týmu.
            </div>
          ) : grouping ? (
            <LineupPreview grouping={grouping} />
          ) : null}
        </CardContent>
      </Card>

      {/* Match settings (only for matches) */}
      {tracker.eventCategory === 0 && (
        <Card className="mb-4">
          <CardContent>
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              <Swords className="mr-1 inline h-4 w-4" />
              Nastavení zápasu
            </h2>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Soupeř
                </span>
                <input
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="Název soupeře"
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Formát zápasu
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { v: 1, label: 'Bez přestávky' },
                    { v: 2, label: '2 poločasy' },
                    { v: 3, label: '3 třetiny' },
                    { v: 4, label: '4 čtvrtiny' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setPeriodCount(periodCount === opt.v ? null : opt.v)}
                      className={`rounded-md border px-3 py-1.5 text-xs transition ${
                        periodCount === opt.v
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {periodCount !== null && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {periodCount === 1 ? 'Délka zápasu (min)' : 'Délka jedné části (min)'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={partDuration ?? ''}
                    onChange={(e) =>
                      setPartDuration(e.target.value ? Math.max(1, Number(e.target.value)) : null)
                    }
                    placeholder={periodCount === 1 ? '60' : '20'}
                    className="h-9 w-32 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <Card className="mb-4">
        <CardContent>
          <h2 className="mb-3 text-sm font-semibold text-gray-800">
            <Star className="mr-1 inline h-4 w-4" />
            Sledované údaje
          </h2>

          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Standardní
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_STAT_METRICS.map((m) => {
                const picked = isMetricPicked(m.code, m.name)
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => toggleStandardMetric(m)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      picked
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m.name}
                    {m.isGoalkeeper && <span className="ml-1 text-[10px] text-amber-600">(B)</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {(templates?.length ?? 0) > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Týmové šablony
              </p>
              <div className="flex flex-wrap gap-1.5">
                {templates!.map((t) => {
                  const picked = metrics.some((m) => m.name === t.name)
                  return (
                    <span key={t.id} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => addTemplate(t)}
                        disabled={picked}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          picked
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t.name}
                        {t.isGoalkeeper && (
                          <span className="ml-1 text-[10px] text-amber-600">(B)</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTemplateMutation.mutate(t.id)}
                        className="rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                        title="Smazat šablonu"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-3 rounded-lg border border-dashed border-gray-300 p-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Vlastní
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="Např. Střely, Bloky, Fauly..."
                className="h-9 flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomMetric()
                  }
                }}
              />
              <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={newMetricGoalie}
                  onChange={(e) => setNewMetricGoalie(e.target.checked)}
                />
                Brankářská
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={addCustomMetric}
                disabled={!newMetric.trim()}
              >
                <Plus className="h-4 w-4" />
                Přidat
              </Button>
              {newMetric.trim() && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    saveTemplateMutation.mutate({
                      name: newMetric.trim(),
                      isGoalkeeper: newMetricGoalie,
                    })
                    addCustomMetric()
                  }}
                  title="Uložit také jako týmovou šablonu"
                >
                  Uložit jako šablonu
                </Button>
              )}
            </div>
          </div>

          {metrics.length > 0 ? (
            <div className="rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Název</th>
                    <th className="px-3 py-2 font-medium">Druh</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, idx) => (
                    <tr key={`${m.code}-${m.name}-${idx}`} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        {m.name}
                        {m.code === 'custom' && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            vlastní
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {m.isGoalkeeper ? 'Brankářská' : 'Hráči v poli'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeMetric(idx)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Vyber alespoň jeden údaj pro sledování.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setupMutation.mutate()}
          disabled={!canSave || setupMutation.isPending}
        >
          <Save className="h-4 w-4" />
          Uložit
        </Button>
        <Button onClick={saveAndStart} disabled={!canSave || setupMutation.isPending}>
          Spustit zápis
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function LineupPreview({ grouping }: { grouping: ReturnType<typeof groupLineup> }) {
  return (
    <div className="space-y-3">
      {grouping.goalies.length > 0 && (
        <PreviewBlock title="Brankáři" accent="amber">
          {grouping.goalies.map((m) => (
            <PreviewChip
              key={m.memberId}
              name={`${m.firstName} ${m.lastName}`.trim()}
              accent="amber"
            />
          ))}
        </PreviewBlock>
      )}
      {grouping.formations.map((f) => (
        <PreviewBlock key={f.id} title={f.label || `Formace ${f.index + 1}`} accent={f.colorKey}>
          {f.members.length === 0 ? (
            <span className="text-xs text-gray-400 italic">— prázdná —</span>
          ) : (
            f.members.map((m) => (
              <PreviewChip
                key={m.memberId}
                name={`${m.firstName} ${m.lastName}`.trim()}
                accent={f.colorKey}
              />
            ))
          )}
        </PreviewBlock>
      ))}
      {grouping.bench.length > 0 && (
        <PreviewBlock title="Lavička" accent="gray">
          {grouping.bench.map((m) => (
            <PreviewChip
              key={m.memberId}
              name={`${m.firstName} ${m.lastName}`.trim()}
              accent="gray"
            />
          ))}
        </PreviewBlock>
      )}
    </div>
  )
}

function PreviewBlock({
  title,
  accent,
  children,
}: {
  title: string
  accent: string
  children: React.ReactNode
}) {
  const c =
    accent === 'gray' || accent === 'amber'
      ? {
          border: accent === 'amber' ? 'border-amber-300' : 'border-gray-200',
          text: accent === 'amber' ? 'text-amber-700' : 'text-gray-700',
        }
      : { border: colorClasses(accent).border, text: colorClasses(accent).text }
  return (
    <div className={`rounded-lg border ${c.border} bg-white p-2.5`}>
      <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${c.text}`}>{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function PreviewChip({ name, accent }: { name: string; accent: string }) {
  const c =
    accent === 'gray'
      ? 'bg-gray-100 text-gray-700'
      : accent === 'amber'
        ? 'bg-amber-100 text-amber-800'
        : `${colorClasses(accent).bgSoft} ${colorClasses(accent).text}`
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${c}`}>{name}</span>
  )
}
