'use client'

import { Activity, AlertCircle, CheckCircle2, Loader2, PlayCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

type StatusKind = 'ready' | 'running' | 'partial-ready' | 'needs-input' | 'error'

type StatusStripProps = {
  status: StatusKind
  onViewActivity?: () => void
  label?: string
  className?: string
}

const statusMap: Record<StatusKind, { label: string; detail: string; icon: React.ReactNode; badgeVariant: 'muted' | 'success' | 'warn' | 'danger' | 'info' }> = {
  ready: {
    label: 'Ready',
    detail: 'Everything needed for this view is available.',
    icon: <CheckCircle2 className="h-4 w-4" />,
    badgeVariant: 'success',
  },
  running: {
    label: 'Background Running',
    detail: 'Agents are actively generating and syncing artifacts.',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    badgeVariant: 'warn',
  },
  'partial-ready': {
    label: 'Partial Ready',
    detail: 'Some sections are available while generation continues.',
    icon: <Sparkles className="h-4 w-4" />,
    badgeVariant: 'info',
  },
  'needs-input': {
    label: 'Needs Input',
    detail: 'Complete the next action to continue progress.',
    icon: <PlayCircle className="h-4 w-4" />,
    badgeVariant: 'muted',
  },
  error: {
    label: 'Attention Needed',
    detail: 'A blocking issue was detected. Review the activity log.',
    icon: <AlertCircle className="h-4 w-4" />,
    badgeVariant: 'danger',
  },
}

function StatusStrip({ status, onViewActivity, label, className }: StatusStripProps) {
  const meta = statusMap[status]

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3',
        className
      )}
    >
      <div className="min-w-0">
        <Badge variant={meta.badgeVariant} className="gap-1.5">
          {meta.icon}
          {label || meta.label}
        </Badge>
        <p className="mt-1 text-xs text-muted-foreground">{meta.detail}</p>
      </div>

      {onViewActivity ? (
        <Button variant="ghost" size="sm" onClick={onViewActivity}>
          <Activity className="mr-1.5 h-4 w-4" />
          Activity
        </Button>
      ) : null}
    </div>
  )
}

export { StatusStrip }
export type { StatusKind }
