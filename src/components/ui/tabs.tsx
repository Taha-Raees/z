'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

type TabItem = {
  key: string
  label: string
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-border bg-muted/40 p-1', className)}>
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition-colors',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export { Tabs }

