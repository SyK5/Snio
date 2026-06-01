import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-2xl border', {
  variants: {
    tone: {
      base: 'border-border bg-card',
      muted: 'border-border bg-surface-muted',
      accent: 'border-primary/30 bg-primary/10',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: { tone: 'base', padding: 'md' },
})

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, tone, padding, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ tone, padding }), className)} {...props} />
))

Card.displayName = 'Card'
