'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

type ActivityDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

const FALLBACK_ITEMS = [
  { id: 'a1', agent: 'Admissions Officer', event: 'Profile reviewed', time: 'Just now', status: 'success' as const },
  { id: 'a2', agent: 'Curriculum Architect', event: 'Building module map', time: '2m ago', status: 'warn' as const },
  { id: 'a3', agent: 'Lesson Builder', event: 'Drafting lesson notes', time: '4m ago', status: 'muted' as const },
]

function ActivityDrawer({ open, onOpenChange, title = 'Background activity' }: ActivityDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onOpenChange, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close activity drawer"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">UI shell for agent logs. Static fallback is active.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {FALLBACK_ITEMS.map((item) => (
            <Card key={item.id} className="rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.agent}</p>
                    <p className="text-xs text-muted-foreground">{item.event}</p>
                  </div>
                  <Badge variant={item.status}>{item.time}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className={cn('mt-4 text-[11px] text-muted-foreground')}>
          TODO: Wire this drawer to background event endpoints in Phase 3 if stable endpoints are available.
        </p>
      </aside>
    </div>
  )
}

export { ActivityDrawer }

