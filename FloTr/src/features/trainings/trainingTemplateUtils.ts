import type {
  TrainingDto,
  TrainingTemplateDto,
  TrainingTemplatePartDto,
} from '../../types/domain.types'

/** Minimal part shape shared by saved trainings and the (unsaved) training form. */
export interface SourcePart {
  name?: string
  description?: string
  duration: number
  activityIds: number[]
}

export function sourcePartsFromTraining(training: TrainingDto): SourcePart[] {
  return (training.trainingParts ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({
      name: p.name,
      description: p.description,
      duration: p.duration,
      activityIds: (p.trainingGroups ?? [])
        .map((g) => g.activity?.id)
        .filter((id): id is number => id != null),
    }))
}

/** Builds template parts from the picked source parts; without activities only the skeleton stays. */
export function buildTemplateParts(
  parts: SourcePart[],
  selected: number[],
  includeActivities: boolean
): TrainingTemplatePartDto[] {
  return selected
    .slice()
    .sort((a, b) => a - b)
    .filter((i) => parts[i])
    .map((i, order) => ({
      name: parts[i].name ?? '',
      description: parts[i].description ?? '',
      duration: parts[i].duration,
      order: order + 1,
      activityIds: includeActivities ? [...new Set(parts[i].activityIds)] : [],
    }))
}

/** Form-shaped part (matches TrainingFormPage's trainingParts field array). */
export interface FormPartLike {
  id: number
  name: string
  description?: string
  duration: number
  order: number
  trainingGroups: { id: number; activityId?: number | null }[]
}

/** Fresh form parts from a template; negative ids mark them as new. */
export function templateToFormParts(
  template: Pick<TrainingTemplateDto, 'parts'>,
  startOrder = 1,
  idSeed = Date.now()
): FormPartLike[] {
  return template.parts
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((p, i) => ({
      id: -(idSeed + i * 100),
      name: p.name ?? '',
      description: p.description ?? '',
      duration: p.duration,
      order: startOrder + i,
      trainingGroups: p.activityIds.length
        ? p.activityIds.map((activityId, gi) => ({ id: -(idSeed + i * 100 + gi + 1), activityId }))
        : [{ id: -(idSeed + i * 100 + 1), activityId: null }],
    }))
}

/** Inserts template parts at the start or end of the form parts and renumbers `order`. */
export function insertTemplateParts<T extends FormPartLike>(
  existing: T[],
  template: Pick<TrainingTemplateDto, 'parts'>,
  position: 'start' | 'end',
  idSeed = Date.now()
): (T | FormPartLike)[] {
  const added = templateToFormParts(template, 1, idSeed)
  const merged: (T | FormPartLike)[] =
    position === 'start' ? [...added, ...existing] : [...existing, ...added]
  return merged.map((p, i) => ({ ...p, order: i + 1 }))
}
