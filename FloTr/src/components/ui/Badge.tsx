import { type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
}

const sizes = {
  sm: 'px-1.5 py-0 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
