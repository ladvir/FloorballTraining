import { type InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

/**
 * Password field with a hold-to-reveal eye button: the value is shown while the button
 * is pressed (mouse or touch) and re-masked as soon as it is released.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hide = () => setVisible(false)

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-9 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm',
              'placeholder:text-gray-400',
              'focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
              className
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Podržením zobrazíte heslo"
            title="Podržením zobrazíte heslo"
            onMouseDown={() => setVisible(true)}
            onMouseUp={hide}
            onMouseLeave={hide}
            onTouchStart={() => setVisible(true)}
            onTouchEnd={hide}
            onTouchCancel={hide}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
