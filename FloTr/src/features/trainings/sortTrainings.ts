import type { TrainingDto } from '../../types/domain.types'

export type SortKey = 'name-asc' | 'name-desc' | 'duration-asc' | 'duration-desc'

export function sortTrainings(list: TrainingDto[], key: SortKey): TrainingDto[] {
  const sorted = [...list]
  switch (key) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'cs'))
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'cs'))
    case 'duration-asc':
      return sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0))
    case 'duration-desc':
      return sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0))
  }
}
