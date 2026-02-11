import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 text-sm text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }

