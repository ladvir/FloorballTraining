import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

/**
 * A club member's name rendered as a link to their detail page (/members/:id).
 * Use everywhere a member name is shown so it's consistently clickable.
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
