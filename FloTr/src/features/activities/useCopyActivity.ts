import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../utils/toast'
import { activitiesApi } from '../../api/activities.api'
import type { ActivityDto } from '../../types/domain.types'

/** Copies an activity (tags, drawings, videos…) server-side and opens the copy for editing. */
export function useCopyActivity() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => activitiesApi.copy(id),
    onError: () => toast.error(t('activities.copyFailed')),
    onSuccess: (copy) => {
      // The edit page looks the activity up in the ['activities'] cache — put the copy there
      // synchronously, a refetch alone would race the navigation.
      queryClient.setQueryData<ActivityDto[]>(['activities'], (old) =>
        old ? [...old, copy] : [copy]
      )
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      navigate(`/activities/${copy.id}/edit`)
    },
  })
}
