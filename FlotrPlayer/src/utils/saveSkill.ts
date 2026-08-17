import { useMutation, useQueryClient } from '@tanstack/react-query'
import { playerSkillsApi } from '../api'
import type { PlayerSkillDto } from '../types/domain.types'

type SkillPatch = Partial<Pick<PlayerSkillDto, 'grade' | 'targetGrade' | 'recommendation'>>

// Coach edits (grade / target grade / recommendation) save immediately, one skill at a time - no
// "Režim úprav" session and no separate confirm step (supersedes #88's batch-and-confirm flow).
// The write endpoint only ever took a full item per skill, so a single tap just sends an array of
// one, carrying over whatever wasn't touched from `skill` itself.
export function useSaveSkill(memberId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { skill: PlayerSkillDto; patch: SkillPatch }) =>
      playerSkillsApi.saveBatch(memberId, [
        {
          skillId: vars.skill.skillId,
          grade: vars.patch.grade ?? vars.skill.grade!,
          targetGrade: vars.patch.targetGrade !== undefined ? vars.patch.targetGrade : vars.skill.targetGrade,
          recommendation:
            vars.patch.recommendation !== undefined ? vars.patch.recommendation : vars.skill.recommendation,
        },
      ]),
    onSuccess: (updated) => queryClient.setQueryData(['playerskills', 'card', memberId], updated),
  })
}
