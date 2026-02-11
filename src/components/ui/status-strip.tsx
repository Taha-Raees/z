'use client'

import { Activity, AlertCircle, CheckCircle2, Loader2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

type StatusKind = 'ready' | 'running' | 'needs-input' | 'error'

type StatusStripProps = {
  status: StatusKind
  onViewActivity?: () => void
  label?: string
  className?: string
}

const statusMap: Record<StatusKind, { label: string; icon: React.ReactNode; badgeVariant: 'muted' | 'success' | 'warn' | 'danger' }> = {
  ready: {
    label: 'Ready',
    icon: <CheckCircle2 className="h-4 w-4" />,
    badgeVariant: 'success',
  },
  running: {
    label: 'Running',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    badgeVariant: 'warn',
  },
  'needs-input': {
    label: 'Needs input',
    icon: <PlayCircle className="h-4 w-4" />,
    badgeVariant: 'muted',
  },
  error: {
    label: 'Error',
    icon: <AlertCircle className="h-4 w-4" />,
    badgeVariant: 'danger',
  },
}

function StatusStrip({ status, onViewActivity, label, className }: StatusStripProps) {
  const meta = statusMap[status]

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant={meta.badgeVariant} className="gap-1.5">
          {meta.icon}
          {label || meta.label}
        </Badge>
        <span className="text-xs text-muted-foreground">Background agents continue working while you navigate.</span>
      </div>

      <Button variant="ghost" size="sm" onClick={onViewActivity}>
        <Activity className="mr-1.5 h-4 w-4" />
        View activity
      </Button>
    </div>
  )
}

export { StatusStrip }
export type { StatusKind }

