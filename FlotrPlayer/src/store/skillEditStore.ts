import { create } from 'zustand'
import type { PlayerSkillDto } from '../types/domain.types'

export interface SkillEdit {
  grade: number
  targetGrade: number | null
  recommendation: string | null
}

interface SkillEditState {
  memberId: number | null
  edits: Record<number, SkillEdit>
  startEditing: (memberId: number) => void
  discardEditing: () => void
  setGrade: (skill: PlayerSkillDto, grade: number) => void
  setTargetGrade: (skill: PlayerSkillDto, targetGrade: number | null) => void
  setRecommendation: (skill: PlayerSkillDto, recommendation: string | null) => void
}

const baseline = (skill: PlayerSkillDto, edits: Record<number, SkillEdit>): SkillEdit => ({
  grade: edits[skill.skillId]?.grade ?? skill.grade ?? 0,
  targetGrade: edits[skill.skillId]?.targetGrade ?? skill.targetGrade,
  recommendation: edits[skill.skillId]?.recommendation ?? skill.recommendation,
})

// Session-scoped pending edits for the coach's "Režim úprav" (Etapa 10, #88): one card visit
// accumulates any number of grade/target-grade/recommendation changes here, sent together via a
// single Save button (PUT /playerskills/member/{id}) - never autosaved, never persisted to disk
// (offline is out of MVP scope per the issue). Session is keyed by memberId so switching to
// another card, or leaving, always starts from a clean slate (see discardEditing callers).
export const useSkillEditStore = create<SkillEditState>((set) => ({
  memberId: null,
  edits: {},

  startEditing: (memberId) => set({ memberId, edits: {} }),
  discardEditing: () => set({ memberId: null, edits: {} }),

  setGrade: (skill, grade) =>
    set((state) => ({
      edits: { ...state.edits, [skill.skillId]: { ...baseline(skill, state.edits), grade } },
    })),

  setTargetGrade: (skill, targetGrade) =>
    set((state) => ({
      edits: { ...state.edits, [skill.skillId]: { ...baseline(skill, state.edits), targetGrade } },
    })),

  setRecommendation: (skill, recommendation) =>
    set((state) => ({
      edits: { ...state.edits, [skill.skillId]: { ...baseline(skill, state.edits), recommendation } },
    })),
}))

/** Effective (base + pending edit) view of a skill - what every editable badge/field renders. */
export const applyEdit = (skill: PlayerSkillDto, edits: Record<number, SkillEdit>): PlayerSkillDto => {
  const edit = edits[skill.skillId]
  if (!edit) return skill
  return { ...skill, grade: edit.grade, targetGrade: edit.targetGrade, recommendation: edit.recommendation }
}

/** Builds the PUT payload from accumulated edits - one item per touched skill. */
export const buildBatchItems = (edits: Record<number, SkillEdit>) =>
  Object.entries(edits).map(([skillId, edit]) => ({ skillId: Number(skillId), ...edit }))
