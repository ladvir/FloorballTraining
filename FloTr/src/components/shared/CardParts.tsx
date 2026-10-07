import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/** Round icon-only action button used in the footer of training/activity cards. */
export function CardIconButton({
  title,
  onClick,
  children,
  tone = 'default',
  disabled,
}: {
  title: string
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors disabled:opacity-50',
        tone === 'danger'
          ? 'hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          : 'hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600'
      )}
    >
      {children}
    </button>
  )
}

/** Initials avatar + name (author line of a card). */
export function AuthorChip({ name, compact }: { name: string; compact?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span title={name} className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">
        {initials}
      </span>
      {!compact && <span className="truncate">{name}</span>}
    </span>
  )
}
