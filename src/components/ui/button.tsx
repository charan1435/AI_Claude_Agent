import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base: sharp corners (rounded-none / var(--radius-sm)=2px), IBM Plex Sans, no chunky shadows
  'group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ochre focus-visible:ring-offset-1 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        // Primary: deep ochre background, white text
        default:
          'bg-ochre text-white hover:bg-ochre/90 active:bg-ochre/80',
        // Ink: dark ink background, paper text (secondary CTA)
        ink:
          'bg-ink text-white hover:bg-ink/90 active:bg-ink/80',
        // Outline: hairline border, ink text — for "cancel" / ghost actions
        outline:
          'border-hairline bg-transparent text-ink hover:bg-hairline/50',
        // Ghost: no border, muted text — for subtle actions
        ghost:
          'text-ink-muted hover:text-ink hover:bg-hairline/40',
        // Destructive: oxblood — for delete actions
        destructive:
          'bg-oxblood text-white hover:bg-oxblood/90 active:bg-oxblood/80',
        // Link style
        link: 'text-ochre underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 gap-1.5 px-4 py-2',
        sm: 'h-7 gap-1 px-3 text-xs',
        lg: 'h-11 gap-2 px-6 text-base',
        icon: 'size-9',
        'icon-sm': 'size-7',
        'icon-lg': 'size-11',
        xs: 'h-6 gap-1 px-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
