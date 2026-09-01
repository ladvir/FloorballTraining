import { describe, expect, it } from 'vitest'
import {
  buildTestResultPayload,
  canSubmitTestResult,
  TEST_TYPE_GRADE,
  TEST_TYPE_NUMBER,
  type TestResultFormState,
} from './testResult'
import type { TestDefinitionDto } from '../types/domain.types'

const numberTest: TestDefinitionDto = {
  id: 1,
  name: 'Sprint 20 m',
  testType: TEST_TYPE_NUMBER,
  unit: 's',
  skillId: 7,
  gradeOptions: [],
}

const gradeTest: TestDefinitionDto = {
  id: 2,
  name: 'Vedení míčku',
  testType: TEST_TYPE_GRADE,
  unit: null,
  skillId: 8,
  gradeOptions: [{ id: 10, label: 'Výborně', numericValue: 1, colour: null, sortOrder: 0, skillGrade: 1 }],
}

const form = (over: Partial<TestResultFormState> = {}): TestResultFormState => ({
  numericValue: '',
  gradeOptionId: null,
  note: '',
  testDate: '2026-09-01',
  ...over,
})

describe('buildTestResultPayload', () => {
  it('Number test → numericValue parsed, gradeOptionId null', () => {
    expect(buildTestResultPayload(numberTest, form({ numericValue: '3.45' }))).toEqual({
      testDefinitionId: 1,
      numericValue: 3.45,
      gradeOptionId: null,
      testDate: '2026-09-01',
      note: null,
    })
  })

  it('Grade test → gradeOptionId kept, numericValue null (even if a stray value is in the form)', () => {
    expect(buildTestResultPayload(gradeTest, form({ gradeOptionId: 10, numericValue: '99' }))).toEqual({
      testDefinitionId: 2,
      numericValue: null,
      gradeOptionId: 10,
      testDate: '2026-09-01',
      note: null,
    })
  })

  it('note is trimmed, blank/whitespace becomes null', () => {
    expect(buildTestResultPayload(numberTest, form({ numericValue: '1', note: '  ok  ' })).note).toBe('ok')
    expect(buildTestResultPayload(numberTest, form({ numericValue: '1', note: '   ' })).note).toBeNull()
  })
})

describe('canSubmitTestResult', () => {
  it('Number test needs a non-empty numericValue', () => {
    expect(canSubmitTestResult(numberTest, form({ numericValue: '3.45' }))).toBe(true)
    expect(canSubmitTestResult(numberTest, form({ numericValue: '   ' }))).toBe(false)
    expect(canSubmitTestResult(numberTest, form())).toBe(false)
  })

  it('Grade test needs a picked gradeOptionId', () => {
    expect(canSubmitTestResult(gradeTest, form({ gradeOptionId: 10 }))).toBe(true)
    expect(canSubmitTestResult(gradeTest, form())).toBe(false)
  })
})
