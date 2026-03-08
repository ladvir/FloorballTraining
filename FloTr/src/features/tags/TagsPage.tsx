import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { tagsApi } from '../../api/index'

export function TagsPage() {
  const { data: tags, isLoading } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  if (isLoading) return <LoadingSpinner />
  return (
    <div>
      <PageHeader title="Tagy" />
      {!tags?.length ? (
        <EmptyState title="Žádné tagy" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: tag.color ?? '#6b7280' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
