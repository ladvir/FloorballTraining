import { type ReactNode } from 'react'
import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title = 'Žádná data',
  description = 'Zatím zde nic není.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-1 text-sm font-semibold text-gray-700">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      {action}
    </div>
  )
}
