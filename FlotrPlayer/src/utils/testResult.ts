import type { CreateTestResultDto, TestDefinitionDto } from '../types/domain.types'

// FloorballTraining.CoreBusiness.Enums.TestType - wire value is the raw int (see TestType in
// domain.types.ts), not a string.
export const TEST_TYPE_NUMBER = 0
export const TEST_TYPE_GRADE = 1

export interface TestResultFormState {
  numericValue: string
  gradeOptionId: number | null
  note: string
  testDate: string
}

/** Does the form carry the answer the selected test's TestType needs (#92)? */
export const canSubmitTestResult = (test: TestDefinitionDto, form: TestResultFormState): boolean =>
  test.testType === TEST_TYPE_GRADE ? form.gradeOptionId != null : form.numericValue.trim().length > 0

/**
 * Shapes the POST /testresults body from the picked test + form (#92). Grade math (1-5 from the
 * result) is the backend's job - DeriveAndApplySkillGradeAsync - nothing derived here.
 */
export const buildTestResultPayload = (
  test: TestDefinitionDto,
  form: TestResultFormState,
): Omit<CreateTestResultDto, 'memberId'> => ({
  testDefinitionId: test.id,
  numericValue: test.testType === TEST_TYPE_NUMBER ? Number(form.numericValue) : null,
  gradeOptionId: test.testType === TEST_TYPE_GRADE ? form.gradeOptionId : null,
  testDate: form.testDate,
  note: form.note.trim() || null,
})
