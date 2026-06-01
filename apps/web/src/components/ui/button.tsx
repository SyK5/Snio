import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-ring',
        ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring',
        danger: 'bg-destructive text-white hover:opacity-90 focus:ring-destructive',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, block, loading, disabled, children, ...props }, ref) => (
  <button ref={ref} disabled={disabled || loading} className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
    {loading ? 'Bitte warten' : children}
  </button>
))

Button.displayName = 'Button'
