import { forwardRef } from 'react'
import { cn } from '@/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn('input-field resize-none', error && 'input-error', className)}
          {...props}
        />
        {error && <p className="error-text">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
