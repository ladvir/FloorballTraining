import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { badgeDefinitionsApi } from '../../api/badgeDefinitions.api'
import type { BadgeDefinitionDto, BadgePeriod } from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const METRICS = [
  'TrainingCount',
  'MatchCount',
  'GoalCount',
  'AssistCount',
  'GoalsPlusAssists',
  'NetPlusMinus',
  'MaxGoalsInMatch',
  'SeasonsPlayed',
  'SeasonAttendancePct',
  'HomeTrainingCount',
  'SkillImprovementCount',
  'SkillTargetCount',
  'TestRecordCount',
  'PlayerOfTrainingCount',
  'PlayerOfMatchCount',
  'FairPlayCount',
  'FamilyCheeredCount',
  'ChallengeCount',
  'CareerXp',
]
const PERIODS: BadgePeriod[] = ['Lifetime', 'Month', 'Season']
// Mirrors BadgeService.IsCumulative / the controller rules so the form only offers valid combinations.
const NON_CUMULATIVE = ['MaxGoalsInMatch', 'SeasonsPlayed', 'SeasonAttendancePct']

const EMPTY: Partial<BadgeDefinitionDto> = {
  code: '',
  metric: 'TrainingCount',
  threshold: 10,
  period: 'Lifetime',
  repeatable: false,
  name: '',
  description: '',
  isActive: true,
}

export function BadgeDefinitionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Partial<BadgeDefinitionDto> | null>(null)

  const [fSearch, setFSearch] = useState('')
  const [fPeriod, setFPeriod] = useState('')
  const [fMetric, setFMetric] = useState('')
  const [fRepeat, setFRepeat] = useState('')
  const [fMin, setFMin] = useState('')
  const [fMax, setFMax] = useState('')
  const selectCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm'
  const { data = [], isLoading } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: badgeDefinitionsApi.getAll,
  })
  const q = fSearch.trim().toLowerCase()
  const filtered = data.filter((d) => {
    const label = (d.name || t(`badge.${d.code}.name`, { defaultValue: d.code })).toLowerCase()
    return (
      (!q || label.includes(q) || d.code.toLowerCase().includes(q)) &&
      (!fPeriod || d.period === fPeriod) &&
      (!fMetric || d.metric === fMetric) &&
      (!fRepeat || d.repeatable === (fRepeat === 'yes')) &&
      (!fMin || d.threshold >= Number(fMin)) &&
      (!fMax || d.threshold <= Number(fMax))
    )
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['badge-definitions'] })
    void queryClient.invalidateQueries({ queryKey: ['xp-badges'] })
  }
  const remove = useMutation({ mutationFn: badgeDefinitionsApi.remove, onSuccess: refresh })

  return (
    <div>
      <PageHeader
        title={t('badgeAdmin.title')}
        description={t('badgeAdmin.subtitle')}
        action={
          <Button onClick={() => setEditing(EMPTY)}>
            <Plus className="mr-1 h-4 w-4" />
            {t('badgeAdmin.add')}
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        <Input
          className="col-span-2"
          placeholder={t('badgeAdmin.filter.search')}
          value={fSearch}
          onChange={(e) => setFSearch(e.target.value)}
        />
        <select className={selectCls} value={fPeriod} onChange={(e) => setFPeriod(e.target.value)}>
          <option value="">{t('badgeAdmin.filter.allPeriods')}</option>
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {t(`badgeAdmin.period.${p}`)}
            </option>
          ))}
        </select>
        <select className={selectCls} value={fMetric} onChange={(e) => setFMetric(e.target.value)}>
          <option value="">{t('badgeAdmin.filter.allMetrics')}</option>
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {t(`badgeAdmin.metric.${m}`, { defaultValue: m })}
            </option>
          ))}
        </select>
        <select className={selectCls} value={fRepeat} onChange={(e) => setFRepeat(e.target.value)}>
          <option value="">{t('badgeAdmin.filter.repeatableAll')}</option>
          <option value="yes">{t('badgeAdmin.filter.repeatableYes')}</option>
          <option value="no">{t('badgeAdmin.filter.repeatableNo')}</option>
        </select>
        <div className="flex gap-1">
          <Input
            type="number"
            placeholder={t('badgeAdmin.filter.minThreshold')}
            value={fMin}
            onChange={(e) => setFMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t('badgeAdmin.filter.maxThreshold')}
            value={fMax}
            onChange={(e) => setFMax(e.target.value)}
          />
        </div>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t('badgeAdmin.filter.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className={d.isActive ? '' : 'opacity-50'}>
              <CardContent className="flex items-start gap-3 py-3">
                <img
                  src={`${API_BASE_URL}/${d.iconPath}`}
                  alt=""
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {d.name || t(`badge.${d.code}.name`, { defaultValue: d.code })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(`badgeAdmin.metric.${d.metric}`, { defaultValue: d.metric })} ≥ {d.threshold}{' '}
                    · {t(`badgeAdmin.period.${d.period}`)}
                    {d.repeatable && ` · ${t('badgeAdmin.repeatableShort')}`}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {d.code} · {t('badgeAdmin.earnedBy', { count: d.earnedCount })}
                    {!d.isActive && ` · ${t('badgeAdmin.inactive')}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    onClick={() => setEditing(d)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {d.isActive && (
                    <button
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm(t('badgeAdmin.confirmRemove'))) remove.mutate(d.id)
                      }}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <BadgeForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function BadgeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<BadgeDefinitionDto>
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isNew = initial.id == null
  const [form, setForm] = useState(initial)
  const [icon, setIcon] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<BadgeDefinitionDto>) => setForm((f) => ({ ...f, ...patch }))

  const metric = form.metric ?? 'TrainingCount'
  const seasonOnly = metric === 'SeasonAttendancePct'
  const lifetimeOnly = metric === 'SeasonsPlayed'
  const period = seasonOnly ? 'Season' : lifetimeOnly ? 'Lifetime' : (form.period ?? 'Lifetime')
  const canRepeat = period === 'Lifetime' && !NON_CUMULATIVE.includes(metric)

  const save = useMutation({
    mutationFn: async () => {
      const dto = { ...form, period, repeatable: canRepeat && !!form.repeatable }
      const saved = isNew
        ? await badgeDefinitionsApi.create(dto)
        : await badgeDefinitionsApi.update(initial.id!, dto)
      if (icon) await badgeDefinitionsApi.uploadIcon(saved.id, icon)
    },
    onSuccess: onSaved,
    onError: (e: unknown) => {
      const data = (e as { response?: { data?: unknown } }).response?.data
      setError(typeof data === 'string' ? data : t('common.error'))
    },
  })

  const valid =
    (isNew ? /^[A-Za-z0-9_]{2,64}$/.test(form.code ?? '') : true) && (form.threshold ?? 0) >= 1
  const label = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? t('badgeAdmin.add') : t('badgeAdmin.edit')}
      maxWidth="lg"
    >
      <div className="space-y-3">
        {isNew && (
          <label className="block">
            <span className={label}>{t('badgeAdmin.code')}</span>
            <Input value={form.code ?? ''} onChange={(e) => set({ code: e.target.value })} />
            <span className="text-xs text-gray-400">{t('badgeAdmin.codeHint')}</span>
          </label>
        )}
        <label className="block">
          <span className={label}>{t('badgeAdmin.name')}</span>
          <Input value={form.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
          <span className="text-xs text-gray-400">{t('badgeAdmin.nameHint')}</span>
        </label>
        <label className="block">
          <span className={label}>{t('badgeAdmin.description')}</span>
          <Input
            value={form.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>{t('badgeAdmin.metricLabel')}</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={metric}
              onChange={(e) => set({ metric: e.target.value })}
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {t(`badgeAdmin.metric.${m}`, { defaultValue: m })}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>{t('badgeAdmin.threshold')}</span>
            <Input
              type="number"
              min={1}
              value={form.threshold ?? 1}
              onChange={(e) => set({ threshold: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className={label}>{t('badgeAdmin.periodLabel')}</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={period}
              disabled={seasonOnly || lifetimeOnly}
              onChange={(e) => set({ period: e.target.value as BadgePeriod })}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`badgeAdmin.period.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
            <input
              type="checkbox"
              disabled={!canRepeat}
              checked={canRepeat && !!form.repeatable}
              onChange={(e) => set({ repeatable: e.target.checked })}
            />
            {t('badgeAdmin.repeatable')}
          </label>
        </div>
        <p className="text-xs text-gray-400">
          {period === 'Lifetime' ? t('badgeAdmin.hintLifetime') : t('badgeAdmin.hintPeriodic')}
        </p>
        <label className="block">
          <span className={label}>{t('badgeAdmin.icon')}</span>
          <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
            <Upload className="h-4 w-4" />
            {icon ? icon.name : t('badgeAdmin.chooseIcon')}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              className="hidden"
              onChange={(e) => setIcon(e.target.files?.[0] ?? null)}
            />
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => set({ isActive: e.target.checked })}
          />
          {t('badgeAdmin.active')}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
