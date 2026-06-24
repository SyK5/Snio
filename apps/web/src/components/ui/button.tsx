import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { withContextMenu, type ContextMenuEntry } from '@/components/ui/context-menu'

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

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'contextMenu'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  contextMenu?: ContextMenuEntry[]
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, loading, disabled, contextMenu, onContextMenu, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      onContextMenu={withContextMenu(contextMenu, onContextMenu)}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading && <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
