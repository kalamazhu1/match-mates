import { cn } from '@/lib/utils'

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSection({ className, title, description, children, ...props }: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}