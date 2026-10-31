import { describe, expect, it } from 'vitest'
import {
  buildTemplateParts,
  insertTemplateParts,
  sourcePartsFromTraining,
  templateToFormParts,
  type FormPartLike,
  type SourcePart,
} from './trainingTemplateUtils'
import type { TrainingDto } from '../../types/domain.types'

const src: SourcePart[] = [
  { name: 'Rozcvička', duration: 10, activityIds: [1, 1, 2] },
  { name: 'Hlavní', duration: 40, activityIds: [3] },
  { name: 'Protažení', duration: 5, activityIds: [] },
]

describe('buildTemplateParts', () => {
  it('keeps picked parts in source order, renumbered, activities de-duplicated', () => {
    const r = buildTemplateParts(src, [2, 0], true)
    expect(r.map((p) => p.name)).toEqual(['Rozcvička', 'Protažení'])
    expect(r.map((p) => p.order)).toEqual([1, 2])
    expect(r[0].activityIds).toEqual([1, 2])
  })

  it('drops activities when only the skeleton is wanted', () => {
    expect(buildTemplateParts(src, [0, 1], false).every((p) => p.activityIds.length === 0)).toBe(
      true
    )
  })

  it('ignores indices that do not exist', () => {
    expect(buildTemplateParts(src, [7], true)).toEqual([])
  })
})

describe('sourcePartsFromTraining', () => {
  it('sorts by order and drops empty groups', () => {
    const t = {
      trainingParts: [
        { id: 2, order: 2, duration: 5, name: 'B', trainingGroups: [{ id: 1 }] },
        {
          id: 1,
          order: 1,
          duration: 10,
          name: 'A',
          trainingGroups: [{ id: 2, activity: { id: 9 } }],
        },
      ],
    } as unknown as TrainingDto
    const r = sourcePartsFromTraining(t)
    expect(r.map((p) => p.name)).toEqual(['A', 'B'])
    expect(r[0].activityIds).toEqual([9])
    expect(r[1].activityIds).toEqual([])
  })
})

describe('templateToFormParts / insertTemplateParts', () => {
  const tpl = {
    parts: [
      { name: 'Konec', duration: 5, order: 2, activityIds: [] },
      { name: 'Začátek', duration: 10, order: 1, activityIds: [4, 5] },
    ],
  }
  const existing: FormPartLike[] = [
    {
      id: 7,
      name: 'Střed',
      duration: 30,
      order: 1,
      trainingGroups: [{ id: 8, activityId: 3 }],
    },
  ]

  it('creates new (negative id) parts, empty part gets one empty group', () => {
    const r = templateToFormParts(tpl, 1, 1000)
    expect(r.map((p) => p.name)).toEqual(['Začátek', 'Konec'])
    expect(r.every((p) => p.id < 0)).toBe(true)
    expect(r[0].trainingGroups.map((g) => g.activityId)).toEqual([4, 5])
    expect(r[1].trainingGroups.map((g) => g.activityId)).toEqual([null])
    expect(new Set(r.flatMap((p) => p.trainingGroups.map((g) => g.id))).size).toBe(3)
  })

  it('inserts at the start and renumbers', () => {
    const r = insertTemplateParts(existing, tpl, 'start', 1000)
    expect(r.map((p) => p.name)).toEqual(['Začátek', 'Konec', 'Střed'])
    expect(r.map((p) => p.order)).toEqual([1, 2, 3])
  })

  it('inserts at the end without touching existing parts', () => {
    const r = insertTemplateParts(existing, tpl, 'end', 1000)
    expect(r.map((p) => p.name)).toEqual(['Střed', 'Začátek', 'Konec'])
    expect(r[0].id).toBe(7)
    expect(r.map((p) => p.order)).toEqual([1, 2, 3])
  })
})
