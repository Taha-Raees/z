import * as React from 'react'
import { cn } from '@/lib/cn'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }

