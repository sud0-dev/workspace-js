import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const button = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border-color,transform] disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--ember)] text-[var(--paper)] hover:bg-[var(--color-ember-700)] active:translate-y-px shadow-[0_1px_0_var(--hairline),0_8px_24px_-12px_var(--ember-glow)]',
        ghost:
          'bg-transparent text-[var(--ink-soft)] hover:bg-[var(--ember-soft)] hover:text-[var(--ink)]',
        outline:
          'border border-[var(--rule)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--rule-strong)] hover:text-[var(--ink)]',
        danger:
          'border border-[color:color-mix(in_oklab,var(--stderr)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--stderr)_10%,transparent)] text-[var(--stderr)] hover:bg-[color:color-mix(in_oklab,var(--stderr)_18%,transparent)]',
      },
      size: {
        sm: 'h-7 px-2.5 text-[0.72rem] uppercase tracking-[0.14em]',
        md: 'h-9 px-3.5 text-[0.78rem] uppercase tracking-[0.14em]',
        lg: 'h-11 px-5 text-[0.85rem] uppercase tracking-[0.14em]',
        icon: 'h-8 w-8 text-base',
      },
      shape: {
        square: 'rounded-none',
        soft: 'rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', shape: 'square' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size, shape }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
