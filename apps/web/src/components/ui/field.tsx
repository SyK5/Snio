import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'

const inputVariants = cva('rounded-lg border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground', {
  variants: {
    state: {
      default: 'border-input focus:border-primary focus:ring-1 focus:ring-ring',
      error: 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive',
    },
  },
  defaultVariants: { state: 'default' },
})

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, Omit<VariantProps<typeof inputVariants>, 'state'> {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({ label, error, className, id, ...props }, ref) => {
  const fieldId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input ref={ref} id={fieldId} className={cn(inputVariants({ state: error ? 'error' : 'default' }), className)} {...props} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
})

TextField.displayName = 'TextField'

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(({ label, error, className, id, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  const fieldId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input ref={ref} id={fieldId} {...props} type={visible ? 'text' : 'password'} className={cn(inputVariants({ state: error ? 'error' : 'default' }), 'w-full pr-10', className)} />
        <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? m.password_hide() : m.password_show()} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground">
          <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
        </button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
})

PasswordField.displayName = 'PasswordField'
