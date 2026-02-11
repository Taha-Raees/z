'use client'

import { useEffect, useState } from 'react'
import { X, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

type Job = {
  id: string
  userId: string
  programId: string | null
  program: { id: string; topic: string; goal: string } | null
  type: string
  status: string
  currentPhase: string | null
  currentItem: string | null
  totalModules: number | null
  completedModules: number | null
  totalLessons: number | null
  completedLessons: number | null
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

type JobEvent = {
  id: string
  index: number
  type: string
  step: string
  status: string
  level: string
  message: string | null
  payload: any
  createdAt: string
}

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

function ActivityDrawer({ open, onOpenChange, title = 'Background activity', programId, lessonId }: ActivityDrawerProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [events, setEvents] = useState<JobEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Fetch jobs when drawer opens
  useEffect(() => {
    if (!open) return

    const fetchJobs = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ limit: '10' })
        if (programId) params.set('programId', programId)
        if (lessonId) params.set('lessonId', lessonId)

        const response = await fetch(`/api/jobs?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setJobs(data.jobs)
        } else {
          setError(data.error || 'Failed to fetch jobs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [open, programId, lessonId])

  // Fetch job events when a job is expanded
  useEffect(() => {
    if (!expandedJobId) return

    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/jobs/${expandedJobId}`)
        const data = await response.json()

        if (data.success) {
          setEvents(data.events || [])
        }
      } catch (err) {
        console.error('Failed to fetch job events:', err)
      }
    }

    fetchEvents()
  }, [expandedJobId])

  // Handle escape key
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

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background p-4 shadow-2xl overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {jobs.length > 0 ? `${jobs.length} recent jobs` : 'No recent activity'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setExpandedJobId(null)
                setEvents([])
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity to display.
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id}>
                <Card
                  className={cn(
                    'cursor-pointer rounded-xl transition-colors',
                    expandedJobId === job.id && 'border-primary'
                  )}
                  onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {expandedJobId === job.id ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {job.type === 'program_build' ? 'Program Build' : job.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {job.program?.topic || 'Unknown program'}
                          </p>
                          {job.currentPhase && (
                            <p className="text-xs text-muted-foreground">
                              Phase: {job.currentPhase}
                            </p>
                          )}
                          {job.error && (
                            <p className="mt-1 text-xs text-red-600">{job.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimeAgo(job.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar for program builds */}
                    {job.type === 'program_build' && job.totalLessons && job.totalLessons > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {job.completedModules || 0}/{job.totalModules} modules
                          </span>
                          <span>
                            {job.completedLessons || 0}/{job.totalLessons} lessons
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${((job.completedLessons || 0) / job.totalLessons) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expanded events */}
                {expandedJobId === job.id && events.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                    {events.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg bg-muted/30 p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {event.step}
                          </span>
                          <Badge variant={getStatusVariant(event.status)} className="text-[10px]">
                            {event.status}
                          </Badge>
                        </div>
                        {event.message && (
                          <p className="mt-0.5 text-muted-foreground">{event.message}</p>
                        )}
                        <p className="mt-0.5 text-muted-foreground/70">
                          {formatTimeAgo(event.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

export { ActivityDrawer }
