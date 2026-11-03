import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../store/authStore'

/**
 * A club member's name rendered as a link to their detail page (/members/:id).
 * Use everywhere a member name is shown so it's consistently clickable.
 * A read-only guest sees the name as plain text (no member detail access).
 * A read-only guest sees the name as plain text (no member detail access).
 * stopPropagation keeps it working inside clickable rows without double-navigating.
 */
export function MemberLink({
  memberId,
  name,
  className,
}: {
  memberId: number
  name: string
  className?: string
}) {
  const isGuest = useAuthStore((s) => s.isGuest)
  if (isGuest) return <span className={className}>{name}</span>
  return (
    <Link
      to={`/members/${memberId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn('text-sky-600 hover:underline', className)}
    >
      {name}
    </Link>
  )
}
