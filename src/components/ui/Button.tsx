import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl focus:ring-orange-500/20',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500/20',
      outline: 'border-2 border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 focus:ring-orange-500/20',
      ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500/20',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20 shadow-lg hover:-translate-y-0.5 hover:shadow-xl'
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    const primaryGradient = 'bg-gradient-to-r from-orange-500 to-orange-600'

    return (
      <button
        className={cn(
          baseStyles,
          variant === 'primary' ? primaryGradient : '',
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }