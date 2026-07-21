import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Save, X as XIcon } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { UnsavedChangesDialog } from '../../components/shared/UnsavedChangesDialog'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { playerSkillsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { PlayerSkillDto, PlayerSkillPosition } from '../../types/domain.types'
import { cn } from '../../utils/cn'
import { SkillDetailModal, SkillGradeBadge, type PendingEdit } from './SkillDetailModal'
import { SkillRadarChart } from './SkillRadarChart'

interface Props {
  memberId: number
}

const POSITIONS: PlayerSkillPosition[] = ['FieldPlayer', 'Goalkeeper', 'Both']

/** "Dovednosti" tab (#91): skill card view/edit + explicit player-role editor. */
export function PlayerSkillsSection({ memberId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAdmin, isHeadCoach, isCoach } = useAuthStore()
  const canEdit = isAdmin || isHeadCoach || isCoach

  const queryKey = ['player-skill-card', memberId]
  const { data: card, isLoading } = useQuery({
    queryKey,
    queryFn: () => playerSkillsApi.getCard(memberId),
  })

  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<Record<number, PendingEdit>>({})
  const [activeSubPosition, setActiveSubPosition] = useState<'FieldPlayer' | 'Goalkeeper'>(
    'FieldPlayer'
  )
  const [detailSkill, setDetailSkill] = useState<PlayerSkillDto | null>(null)

  const unsavedGuard = useUnsavedChangesGuard()

  useEffect(() => {
    if (Object.keys(pending).length > 0) unsavedGuard.markDirty()
    else unsavedGuard.markClean()
  }, [pending, unsavedGuard])

  const roleMutation = useMutation({
    mutationFn: (position: PlayerSkillPosition) => playerSkillsApi.updateRole(memberId, position),
    onSuccess: (updated) => queryClient.setQueryData(queryKey, updated),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      playerSkillsApi.saveBatch(memberId, {
        items: Object.entries(pending).map(([skillId, edit]) => ({
          skillId: Number(skillId),
          grade: edit.grade,
          targetGrade: edit.targetGrade,
          recommendation: edit.recommendation || null,
        })),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated)
      setPending({})
      setEditMode(false)
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (!card) return null

  const isBoth = card.position === 'Both'
  const visibleCategories = isBoth
    ? card.categories.filter((c) => c.position === activeSubPosition)
    : card.categories

  const handleCancelEdit = () => {
    setPending({})
    setEditMode(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <span className="text-sm text-gray-500">{t('playerSkills.role')}: </span>
            <span className="text-sm font-medium text-gray-900">
              {card.explicitRole
                ? t(`playerSkills.position${card.explicitRole}`)
                : t('playerSkills.positionUnset')}
            </span>
          </div>
          {canEdit && (
            <select
              aria-label={t('playerSkills.role')}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-sky-400 focus:outline-none"
              value={card.explicitRole ?? ''}
              onChange={(e) => roleMutation.mutate(e.target.value as PlayerSkillPosition)}
              disabled={roleMutation.isPending}
            >
              <option value="" disabled>
                {t('playerSkills.positionUnset')}
              </option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {t(`playerSkills.position${p}`)}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {isBoth && (
        <div className="flex gap-2">
          {(['FieldPlayer', 'Goalkeeper'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActiveSubPosition(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeSubPosition === p
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {t(`playerSkills.position${p}`)}
            </button>
          ))}
        </div>
      )}

      <SkillRadarChart categories={visibleCategories} pending={pending} />

      {canEdit && (
        <div className="flex justify-end gap-2">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <XIcon className="h-4 w-4" />
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={Object.keys(pending).length === 0 || saveMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {t('common.save')}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleCategories.map((category) => (
          <Card key={category.categoryId}>
            <CardContent className="py-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">{category.name}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {category.skills.map((skill) => {
                  const edit = pending[skill.skillId]
                  const grade = edit?.grade ?? skill.grade
                  return (
                    <button
                      key={skill.skillId}
                      type="button"
                      onClick={() => setDetailSkill(skill)}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <SkillGradeBadge grade={grade} />
                      <span className="flex-1 text-sm text-gray-800">{skill.name}</span>
                      {edit && (
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full bg-sky-500"
                          title={t('playerSkills.unsavedChange')}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {detailSkill && (
        <SkillDetailModal
          memberId={memberId}
          skill={detailSkill}
          pendingEdit={pending[detailSkill.skillId]}
          editable={canEdit && editMode}
          onClose={() => setDetailSkill(null)}
          onSave={(edit) => {
            setPending((prev) => ({ ...prev, [detailSkill.skillId]: edit }))
            setDetailSkill(null)
          }}
        />
      )}

      <UnsavedChangesDialog
        isOpen={unsavedGuard.isBlocked}
        onConfirm={() => {
          setPending({})
          setEditMode(false)
          unsavedGuard.confirm()
        }}
        onCancel={unsavedGuard.cancel}
      />
    </div>
  )
}
