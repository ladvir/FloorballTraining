import { apiClient } from './axios'
import type { CreateTestResultDto, TestDefinitionDto, TestResultDto } from '../types/domain.types'

/** Test library + result recording (#92) - skillId filtering stays client-side, see TestDefinitionDto. */
export const testsApi = {
  getAll: () => apiClient.get<TestDefinitionDto[]>('/testdefinitions').then((r) => r.data),

  createResult: (data: CreateTestResultDto) =>
    apiClient.post<TestResultDto>('/testresults', data).then((r) => r.data),
}
