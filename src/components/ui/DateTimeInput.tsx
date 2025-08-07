import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface DateTimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  type: 'date' | 'datetime-local' | 'time'
}

const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, label, error, required, type, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors',
            'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

DateTimeInput.displayName = 'DateTimeInput'

export { DateTimeInput }