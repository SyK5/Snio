import { forwardRef, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva('rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500', {
  variants: {
    state: {
      default: 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
      error: 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500',
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
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input ref={ref} id={fieldId} className={cn(inputVariants({ state: error ? 'error' : 'default' }), className)} {...props} />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
})

TextField.displayName = 'TextField'
