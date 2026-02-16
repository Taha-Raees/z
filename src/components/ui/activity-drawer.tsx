'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { fetchJobDetails, fetchJobs as fetchJobsApi, type JobEvent, type JobSummary } from '@/lib/api'

type ActivityDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  programId?: string
  lessonId?: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getStatusVariant(status: string): 'success' | 'warn' | 'danger' | 'muted' {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'DONE':
      return 'success'
    case 'RUNNING':
    case 'IN_PROGRESS':
      return 'warn'
    case 'FAILED':
    case 'ERROR':
      return 'danger'
    default:
      return 'muted'
  }
}

function prettyJobType(type: string): string {
  if (type === 'program_build') return 'Program Build'
  if (type === 'lesson_resource_refresh') return 'Resource Refresh'
  return type.replaceAll('_', ' ')
}

function ActivityDrawer({ open, onOpenChange, title = 'Background activity', programId, lessonId }: ActivityDrawerProps) {
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [eventsByJob, setEventsByJob] = useState<Record<string, JobEvent[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const fetchActivityJobs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchJobsApi({
        limit: 12,
        programId,
        lessonId,
      })
      setJobs(data.jobs)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [lessonId, programId])

  const fetchEvents = useCallback(async (jobId: string) => {
    try {
      const data = await fetchJobDetails(jobId)
      setEventsByJob((prev) => ({
        ...prev,
        [jobId]: data.events || [],
      }))
    } catch {
      // Keep drawer resilient; events are secondary
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void fetchActivityJobs()
  }, [fetchActivityJobs, open])

  useEffect(() => {
    if (!expandedJobId) return
    if (eventsByJob[expandedJobId]) return
    void fetchEvents(expandedJobId)
  }, [eventsByJob, expandedJobId, fetchEvents])

  useEffect(() => {
    if (!open) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    const onTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onEscape)
    window.addEventListener('keydown', onTabTrap)
    closeButtonRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onEscape)
      window.removeEventListener('keydown', onTabTrap)
    }
  }, [onOpenChange, open])

  const expandedEvents = useMemo(() => {
    if (!expandedJobId) return []
    return eventsByJob[expandedJobId] || []
  }, [eventsByJob, expandedJobId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" aria-live="polite">
      <button
        aria-label="Close activity drawer"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-border bg-background p-4 shadow-2xl overflow-y-auto"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {jobs.length > 0 ? `${jobs.length} recent jobs` : 'No recent activity'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => void fetchActivityJobs()} disabled={loading} aria-label="Refresh jobs">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No recent activity to display.
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => {
              const expanded = expandedJobId === job.id
              const pct =
                job.type === 'program_build' && typeof job.totalLessons === 'number' && job.totalLessons > 0
                ? Math.round(((job.completedLessons || 0) / job.totalLessons) * 100)
                : null

              return (
                <div key={job.id}>
                  <Card
                    className={cn('cursor-pointer rounded-2xl transition-colors', expanded && 'border-primary/40 bg-primary/5')}
                    onClick={() => setExpandedJobId(expanded ? null : job.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          {expanded ? (
                            <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{prettyJobType(job.type)}</p>
                            <p className="truncate text-xs text-muted-foreground">{job.program?.topic || 'Background task'}</p>
                            {job.currentPhase ? <p className="text-xs text-muted-foreground">Phase: {job.currentPhase}</p> : null}
                            {job.error ? <p className="mt-1 text-xs text-red-700">{job.error}</p> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{formatTimeAgo(job.createdAt)}</p>
                        </div>
                      </div>

                      {pct !== null ? (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              {job.completedLessons || 0}/{job.totalLessons} lessons
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {expanded ? (
                    <div className="ml-5 mt-1 rounded-xl border border-border/70 bg-muted/30 p-2">
                      {expandedEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Loading events...</p>
                      ) : (
                        <div className="space-y-1.5">
                          {expandedEvents.slice(0, 20).map((event) => (
                            <div key={event.id} className="rounded-lg border border-border/60 bg-background p-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-foreground">{event.step}</p>
                                <Badge variant={getStatusVariant(event.status)} className="text-[10px]">
                                  {event.status}
                                </Badge>
                              </div>
                              {event.message ? <p className="mt-0.5 text-muted-foreground">{event.message}</p> : null}
                              <p className="mt-0.5 text-[10px] text-muted-foreground/80">{formatTimeAgo(event.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </aside>
    </div>
  )
}

export { ActivityDrawer }
