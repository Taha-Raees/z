'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, Circle, Loader2, Sparkles, UserRound } from 'lucide-react'
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Textarea,
} from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

type OnboardingProfile = {
  topic: string
  currentLevel: string
  goalLevel: string
  targetDate: string
  hoursPerDay: number
  pacePreference: string
  [key: string]: unknown
}

type AdmissionsQuestion = {
  questionKey: string
  question: string
  rationale?: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  options?: string[]
  required?: boolean
  questionNumber?: number
  progress?: number
}

type StreamProgressItem = {
  index?: number
  type?: string
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message?: string
  level?: string
  timestamp?: string
}

type BuildStatusSnapshot = {
  jobId: string
  programId: string | null
  status: string
  currentPhase: string | null
  currentItem: string | null
  totalModules: number
  completedModules: number
  totalLessons: number
  completedLessons: number
  retryCount: number
  maxRetries: number
  error: string | null
  lastEventIndex: number
  isWorking: boolean
}

type PartialProgramSnapshot = {
  id: string
  topic: string
  goal: string
  currentLevel: string
  status: string
  targetDate: string
  modules: Array<{
    id: string
    index: number
    title: string
    buildStatus: string
    buildError: string | null
    lessons: Array<{
      id: string
      index: number
      title: string
      buildStatus: string
      estimatedMinutes: number
      notes: { summary: string } | null
      resources: Array<{ id: string }>
    }>
  }>
}

type PersistedBuildRef = {
  jobId: string
  programId: string | null
  lastEventIndex: number
  updatedAt: string
}

const ACTIVE_BUILD_STORAGE_KEY = 'aiedu.activeBuildJob.v1'

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

function shortDate(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return date.toLocaleDateString()
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export default function AdmissionsPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<AdmissionsQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [buildJobId, setBuildJobId] = useState<string | null>(null)
  const [programId, setProgramId] = useState<string | null>(null)
  const [lastEventIndex, setLastEventIndex] = useState(0)
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false)
  const [generationLogs, setGenerationLogs] = useState<StreamProgressItem[]>([])
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [buildStatus, setBuildStatus] = useState<BuildStatusSnapshot | null>(null)
  const [partialProgram, setPartialProgram] = useState<PartialProgramSnapshot | null>(null)
  const [isRestoringBuild, setIsRestoringBuild] = useState(false)

  const streamAbortRef = useRef<AbortController | null>(null)
  const redirectedRef = useRef(false)

  const appendGenerationLog = useCallback((item: StreamProgressItem) => {
    setGenerationLogs((prev) => {
      const last = prev[prev.length - 1]
      if (
        last &&
        last.step === item.step &&
        last.status === item.status &&
        (last.message ?? '') === (item.message ?? '')
      ) {
        return prev
      }

      const next = [...prev, item]
      return next.slice(-300)
    })
  }, [])

  const buildProgressPercent = useMemo(() => {
    if (!buildStatus) return 0

    if (buildStatus.totalLessons > 0) {
      return clampProgress((buildStatus.completedLessons / buildStatus.totalLessons) * 100)
    }

    if (buildStatus.totalModules > 0) {
      return clampProgress((buildStatus.completedModules / buildStatus.totalModules) * 100)
    }

    return buildStatus.status === 'COMPLETED' ? 100 : 0
  }, [buildStatus])

  const partialReadyLessons = useMemo(() => {
    if (!partialProgram) return 0
    return partialProgram.modules.reduce(
      (acc, module) => acc + module.lessons.filter((lesson) => lesson.buildStatus === 'COMPLETED').length,
      0
    )
  }, [partialProgram])

  const shouldShowBuildPanel =
    Boolean(buildJobId) ||
    generationLogs.length > 0 ||
    Boolean(generationError) ||
    Boolean(partialProgram) ||
    Boolean(buildStatus)

  const shellStatus = generationError || buildStatus?.status === 'FAILED'
    ? 'error'
    : isGeneratingProgram || buildStatus?.isWorking
      ? 'running'
      : !sessionId || !isComplete
        ? 'needs-input'
        : 'ready'

  const clearPersistedBuild = useCallback(() => {
    try {
      localStorage.removeItem(ACTIVE_BUILD_STORAGE_KEY)
    } catch {
      // Ignore browser storage errors
    }
  }, [])

  useEffect(() => {
    if (!buildJobId) return

    const payload: PersistedBuildRef = {
      jobId: buildJobId,
      programId,
      lastEventIndex,
      updatedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(ACTIVE_BUILD_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore browser storage errors
    }
  }, [buildJobId, programId, lastEventIndex])

  const updateStatusFromPayload = useCallback(
    (payload: Record<string, unknown>) => {
      const nextJobId = typeof payload.jobId === 'string' ? payload.jobId : buildJobId
      const nextProgramId = typeof payload.programId === 'string' ? payload.programId : programId
      const rawStatus = typeof payload.status === 'string' ? payload.status : buildStatus?.status ?? 'QUEUED'
      const currentPhase = typeof payload.currentPhase === 'string' ? payload.currentPhase : null
      const currentItem = typeof payload.currentItem === 'string' ? payload.currentItem : null
      const totalModules = typeof payload.totalModules === 'number' ? payload.totalModules : buildStatus?.totalModules ?? 0
      const completedModules =
        typeof payload.completedModules === 'number'
          ? payload.completedModules
          : buildStatus?.completedModules ?? 0
      const totalLessons = typeof payload.totalLessons === 'number' ? payload.totalLessons : buildStatus?.totalLessons ?? 0
      const completedLessons =
        typeof payload.completedLessons === 'number'
          ? payload.completedLessons
          : buildStatus?.completedLessons ?? 0
      const retryCount = typeof payload.retryCount === 'number' ? payload.retryCount : buildStatus?.retryCount ?? 0
      const maxRetries = typeof payload.maxRetries === 'number' ? payload.maxRetries : buildStatus?.maxRetries ?? 2
      const error = typeof payload.error === 'string' ? payload.error : null
      const nextLastEventIndex =
        typeof payload.lastEventIndex === 'number'
          ? Math.max(lastEventIndex, payload.lastEventIndex)
          : lastEventIndex

      setBuildStatus({
        jobId: nextJobId ?? '',
        programId: nextProgramId ?? null,
        status: rawStatus,
        currentPhase,
        currentItem,
        totalModules,
        completedModules,
        totalLessons,
        completedLessons,
        retryCount,
        maxRetries,
        error,
        lastEventIndex: nextLastEventIndex,
        isWorking: Boolean(payload.isWorking ?? (rawStatus === 'QUEUED' || rawStatus === 'RUNNING')),
      })

      if (nextJobId) setBuildJobId(nextJobId)
      if (nextProgramId) setProgramId(nextProgramId)

      if (typeof payload.lastEventIndex === 'number') {
        setLastEventIndex((prev) => Math.max(prev, payload.lastEventIndex as number))
      }
    },
    [buildJobId, buildStatus, lastEventIndex, programId]
  )

  const connectBuildStream = useCallback(
    async (jobId: string, afterIndex: number) => {
      streamAbortRef.current?.abort()
      const abortController = new AbortController()
      streamAbortRef.current = abortController

      setIsGeneratingProgram(true)

      try {
        const response = await fetch('/api/programs/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, afterIndex }),
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error('Failed to open generation stream')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const processEventBlock = (block: string) => {
          const lines = block
            .split('\n')
            .map((line) => line.trimEnd())
            .filter(Boolean)

          if (lines.length === 0) return

          let eventName = 'message'
          const dataLines: string[] = []

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice('event:'.length).trim()
            }
            if (line.startsWith('data:')) {
              dataLines.push(line.slice('data:'.length).trim())
            }
          }

          const rawPayload = dataLines.join('\n')
          let payload: Record<string, unknown> = {}

          try {
            payload = rawPayload ? (JSON.parse(rawPayload) as Record<string, unknown>) : {}
          } catch {
            payload = {}
          }

          if (eventName === 'status') {
            updateStatusFromPayload(payload)

            appendGenerationLog({
              step: typeof payload.currentPhase === 'string' ? payload.currentPhase : 'Status',
              status: Boolean(payload.isWorking) ? 'in_progress' : 'completed',
              message:
                typeof payload.currentItem === 'string'
                  ? `Working on: ${payload.currentItem}`
                  : typeof payload.status === 'string'
                    ? `Job status: ${payload.status}`
                    : 'Status updated',
              timestamp: new Date().toISOString(),
            })

            return
          }

          if (eventName === 'progress') {
            const idx = typeof payload.index === 'number' ? payload.index : undefined
            if (typeof idx === 'number') {
              setLastEventIndex((prev) => Math.max(prev, idx))
            }

            appendGenerationLog({
              index: idx,
              type: typeof payload.type === 'string' ? payload.type : undefined,
              step: typeof payload.step === 'string' ? payload.step : 'Progress',
              status:
                payload.status === 'failed'
                  ? 'failed'
                  : payload.status === 'completed'
                    ? 'completed'
                    : payload.status === 'pending'
                      ? 'pending'
                      : 'in_progress',
              level: typeof payload.level === 'string' ? payload.level : undefined,
              message: typeof payload.message === 'string' ? payload.message : undefined,
              timestamp:
                typeof payload.timestamp === 'string'
                  ? payload.timestamp
                  : new Date().toISOString(),
            })

            return
          }

          if (eventName === 'partial') {
            const nextProgram = payload.program as PartialProgramSnapshot | undefined
            if (nextProgram) {
              setPartialProgram(nextProgram)
            }

            if (typeof payload.programId === 'string') {
              setProgramId(payload.programId)
            }

            if (typeof payload.lastEventIndex === 'number') {
              setLastEventIndex((prev) => Math.max(prev, payload.lastEventIndex as number))
            }

            return
          }

          if (eventName === 'error') {
            const message =
              typeof payload.error === 'string'
                ? payload.error
                : 'Program generation encountered an error'
            setGenerationError(message)

            appendGenerationLog({
              step: 'Error',
              status: 'failed',
              message,
              timestamp: new Date().toISOString(),
            })

            if (typeof payload.status === 'string') {
              updateStatusFromPayload({
                ...payload,
                isWorking: false,
              })
            }

            return
          }

          if (eventName === 'complete') {
            const nextProgramId = typeof payload.programId === 'string' ? payload.programId : programId
            if (nextProgramId) {
              setProgramId(nextProgramId)
            }

            clearPersistedBuild()
            setIsGeneratingProgram(false)
            setGenerationError(null)

            appendGenerationLog({
              step: 'Generation complete',
              status: 'completed',
              message: 'Program generation completed. Redirecting to program overview...',
              timestamp: new Date().toISOString(),
            })

            if (!redirectedRef.current && nextProgramId) {
              redirectedRef.current = true
              setTimeout(() => {
                window.location.href = `/programs/${nextProgramId}`
              }, 850)
            }

            return
          }

          if (eventName === 'done') {
            const doneStatus = typeof payload.status === 'string' ? payload.status : null

            if (doneStatus) {
              updateStatusFromPayload({
                status: doneStatus,
                isWorking: doneStatus === 'QUEUED' || doneStatus === 'RUNNING',
                lastEventIndex:
                  typeof payload.lastEventIndex === 'number'
                    ? payload.lastEventIndex
                    : lastEventIndex,
              })
            }

            if (doneStatus === 'COMPLETED') {
              clearPersistedBuild()
            }

            setIsGeneratingProgram(false)
            return
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          while (true) {
            const separatorIndex = buffer.indexOf('\n\n')
            if (separatorIndex === -1) break

            const block = buffer.slice(0, separatorIndex)
            buffer = buffer.slice(separatorIndex + 2)
            processEventBlock(block)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        const message = error instanceof Error ? error.message : 'Stream connection failed'
        setGenerationError(message)
        setIsGeneratingProgram(false)

        appendGenerationLog({
          step: 'Stream Error',
          status: 'failed',
          message,
          timestamp: new Date().toISOString(),
        })
      } finally {
        if (streamAbortRef.current === abortController) {
          streamAbortRef.current = null
        }
      }
    },
    [appendGenerationLog, buildStatus?.status, clearPersistedBuild, lastEventIndex, programId, updateStatusFromPayload]
  )

  useEffect(() => {
    let mounted = true

    const restoreFromStorage = async () => {
      try {
        const raw = localStorage.getItem(ACTIVE_BUILD_STORAGE_KEY)
        if (!raw) return

        const persisted = JSON.parse(raw) as PersistedBuildRef
        if (!persisted?.jobId) return

        if (!mounted) return

        setIsRestoringBuild(true)
        setBuildJobId(persisted.jobId)
        setProgramId(persisted.programId ?? null)
        setLastEventIndex(persisted.lastEventIndex ?? 0)

        appendGenerationLog({
          step: 'Reconnect',
          status: 'in_progress',
          message: `Resuming background generation job ${persisted.jobId.slice(-6)}...`,
          timestamp: new Date().toISOString(),
        })

        const statusResponse = await fetch(`/api/programs/generate/status/${persisted.jobId}`, {
          cache: 'no-store',
        })

        if (!statusResponse.ok) {
          clearPersistedBuild()
          return
        }

        const statusData = (await statusResponse.json()) as {
          job?: Record<string, unknown>
          program?: PartialProgramSnapshot
        }

        if (!mounted) return

        if (statusData.job) {
          updateStatusFromPayload({
            ...statusData.job,
            isWorking:
              statusData.job.status === 'QUEUED' ||
              statusData.job.status === 'RUNNING',
          })
        }

        if (statusData.program) {
          setPartialProgram(statusData.program)
        }

        const status = typeof statusData.job?.status === 'string' ? statusData.job.status : null

        if (status === 'QUEUED' || status === 'RUNNING') {
          await connectBuildStream(persisted.jobId, persisted.lastEventIndex ?? 0)
        }

        if (status === 'COMPLETED') {
          clearPersistedBuild()
        }
      } catch {
        clearPersistedBuild()
      } finally {
        if (mounted) {
          setIsRestoringBuild(false)
        }
      }
    }

    void restoreFromStorage()

    return () => {
      mounted = false
      streamAbortRef.current?.abort()
    }
  }, [appendGenerationLog, clearPersistedBuild, connectBuildStream, updateStatusFromPayload])

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admissions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionKey: currentQuestion.questionKey,
          answer,
        }),
      })

      const data = (await response.json()) as {
        isComplete: boolean
        profile?: OnboardingProfile
        nextQuestion?: AdmissionsQuestion
      }

      if (data.isComplete && data.profile) {
        setIsComplete(true)
        setProfile(data.profile)
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion)
        setAnswer('')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admissions/start', {
        method: 'POST',
      })

      const data = (await response.json()) as {
        sessionId: string
        currentQuestion: AdmissionsQuestion
      }

      setSessionId(data.sessionId)
      setCurrentQuestion(data.currentQuestion)
    } catch (error) {
      console.error('Error starting admissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateProgram = async () => {
    if (!profile) return

    setGenerationError(null)
    setPartialProgram(null)
    setGenerationLogs([])
    setIsGeneratingProgram(true)

    appendGenerationLog({
      step: 'Queue',
      status: 'in_progress',
      message: 'Submitting program generation request...',
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await fetch('/api/programs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })

      const payload = (await response.json()) as {
        success?: boolean
        error?: string
        jobId?: string
        programId?: string
        reused?: boolean
        status?: string
      }

      if (!response.ok || !payload.jobId) {
        throw new Error(payload.error || 'Failed to queue program generation')
      }

      setBuildJobId(payload.jobId)
      setProgramId(payload.programId ?? null)
      setLastEventIndex(0)

      setBuildStatus({
        jobId: payload.jobId,
        programId: payload.programId ?? null,
        status: payload.status ?? 'QUEUED',
        currentPhase: 'queued',
        currentItem: null,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        retryCount: 0,
        maxRetries: 2,
        error: null,
        lastEventIndex: 0,
        isWorking: true,
      })

      appendGenerationLog({
        step: 'Queue',
        status: 'completed',
        message: payload.reused
          ? `Reusing active background job ${payload.jobId.slice(-6)}.`
          : `Background job ${payload.jobId.slice(-6)} queued successfully.`,
        timestamp: new Date().toISOString(),
      })

      await connectBuildStream(payload.jobId, 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate program'
      setGenerationError(message)
      setIsGeneratingProgram(false)

      appendGenerationLog({
        step: 'Queue',
        status: 'failed',
        message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleRetryBuild = async () => {
    if (!buildJobId) return

    setGenerationError(null)
    setIsGeneratingProgram(true)

    appendGenerationLog({
      step: 'Retry',
      status: 'in_progress',
      message: 'Requesting retry for failed background job...',
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await fetch(`/api/programs/generate/retry/${buildJobId}`, {
        method: 'POST',
      })

      const payload = (await response.json()) as {
        success?: boolean
        error?: string
        retryCount?: number
        maxRetries?: number
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Retry request failed')
      }

      setBuildStatus((prev) =>
        prev
          ? {
              ...prev,
              status: 'QUEUED',
              isWorking: true,
              retryCount: payload.retryCount ?? prev.retryCount,
              maxRetries: payload.maxRetries ?? prev.maxRetries,
              error: null,
              currentPhase: 'queued',
              currentItem: null,
            }
          : prev
      )

      appendGenerationLog({
        step: 'Retry',
        status: 'completed',
        message: 'Retry queued. Reconnecting to background stream...',
        timestamp: new Date().toISOString(),
      })

      await connectBuildStream(buildJobId, lastEventIndex)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry failed'
      setGenerationError(message)
      setIsGeneratingProgram(false)

      appendGenerationLog({
        step: 'Retry',
        status: 'failed',
        message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const renderBuildPanel = () => {
    if (!shouldShowBuildPanel) return null

    const isRunning = isGeneratingProgram || buildStatus?.isWorking
    const statusLabel = isRestoringBuild
      ? 'Reconnecting'
      : buildStatus?.status
        ? `Job ${buildStatus.status}`
        : isRunning
          ? 'Running'
          : 'Idle'

    const statusVariant: 'muted' | 'success' | 'warn' | 'danger' =
      buildStatus?.status === 'FAILED'
        ? 'danger'
        : buildStatus?.status === 'COMPLETED'
          ? 'success'
          : isRunning
            ? 'warn'
            : 'muted'

    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Program build pipeline</CardTitle>
            <CardDescription>Background iterative generation with reconnect-safe streaming.</CardDescription>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Circle
              className={`h-3.5 w-3.5 ${
                isRunning
                  ? 'animate-pulse text-blue-500'
                  : buildStatus?.status === 'COMPLETED'
                    ? 'text-green-500'
                    : buildStatus?.status === 'FAILED'
                      ? 'text-red-500'
                      : 'text-muted-foreground'
              }`}
              fill="currentColor"
            />
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            {buildJobId ? (
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {buildJobId.slice(-8)}
              </span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Background agents continue working while you can proceed with admissions or open generated lessons.
          </p>

          {buildStatus ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Phase:</span>
                  <span className="rounded bg-background px-2 py-0.5 text-foreground">
                    {buildStatus.currentPhase || 'queued'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current item:</span>
                  <span className="max-w-[220px] truncate rounded bg-background px-2 py-0.5 text-foreground">
                    {buildStatus.currentItem || '—'}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    Lessons {buildStatus.completedLessons}/{Math.max(buildStatus.totalLessons, 0)}
                  </span>
                  <span>{Math.round(buildProgressPercent)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round(buildProgressPercent)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded bg-background px-2 py-1 text-foreground">
                  Modules: {buildStatus.completedModules}/{buildStatus.totalModules}
                </span>
                <span className="rounded bg-background px-2 py-1 text-foreground">
                  Retries: {buildStatus.retryCount}/{buildStatus.maxRetries}
                </span>
                {buildStatus.programId ? (
                  <Link
                    href={`/programs/${buildStatus.programId}`}
                    className="rounded bg-primary px-2 py-1 font-semibold text-primary-foreground"
                  >
                    Open Program
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Live event log
              </h4>
              <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded border border-border/70 bg-background p-2">
                {generationLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Waiting for background events...</p>
                ) : null}

                {generationLogs.map((log, index) => (
                  <div key={`${log.index ?? index}-${log.step}-${index}`} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-1 inline-block h-2 w-2 rounded-full ${
                        log.status === 'completed'
                          ? 'bg-green-500'
                          : log.status === 'failed'
                            ? 'bg-red-500'
                            : log.status === 'in_progress'
                              ? 'animate-pulse bg-blue-500'
                              : 'bg-gray-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{log.step}</p>
                      {log.message ? <p className="text-muted-foreground">{log.message}</p> : null}
                      {log.timestamp ? (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Partial program availability
              </h4>
              {partialProgram ? (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ready lessons: <span className="font-semibold text-foreground">{partialReadyLessons}</span>
                  </p>
                  <div className="mt-2 max-h-56 space-y-2 overflow-auto">
                    {partialProgram.modules.map((module) => (
                      <div key={module.id} className="rounded border border-border/70 bg-background p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-foreground">
                            Module {module.index + 1}: {module.title}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              STATUS_STYLE[module.buildStatus] || STATUS_STYLE.PENDING
                            }`}
                          >
                            {module.buildStatus.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {module.lessons.slice(0, 5).map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1"
                            >
                              <p className="truncate text-[11px] text-foreground/90">
                                L{lesson.index + 1}: {lesson.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                    STATUS_STYLE[lesson.buildStatus] || STATUS_STYLE.PENDING
                                  }`}
                                >
                                  {lesson.buildStatus.replace('_', ' ')}
                                </span>
                                {lesson.buildStatus === 'COMPLETED' ? (
                                  <Link
                                    href={`/lessons/${lesson.id}`}
                                    className="text-[10px] font-semibold text-primary hover:underline"
                                  >
                                    Open
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Modules and lessons will appear immediately as each chunk completes.
                </p>
              )}
            </div>
          </div>

          {generationError ? (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700">
              {generationError}
            </p>
          ) : null}

          {buildStatus?.status === 'FAILED' &&
          buildJobId &&
          buildStatus.retryCount < buildStatus.maxRetries ? (
            <Button onClick={handleRetryBuild} disabled={isGeneratingProgram} size="sm">
              Retry Build ({buildStatus.retryCount}/{buildStatus.maxRetries})
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (isComplete && profile) {
    return (
      <AppShell nav={productNav} currentPath="/admissions" status={shellStatus}>
        <div className="mx-auto max-w-4xl space-y-6">
          <PageHeader
            title="Admissions summary"
            subtitle="Admissions turns your goals into a runnable program plan."
            actions={<Badge variant="success">Profile ready</Badge>}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Profile snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryItem label="Topic" value={profile.topic} />
              <SummaryItem label="Current Level" value={profile.currentLevel} />
              <SummaryItem label="Goal Level" value={profile.goalLevel} />
              <SummaryItem label="Target Date" value={profile.targetDate} />
              <SummaryItem label="Hours per Day" value={`${profile.hoursPerDay} hours`} />
              <SummaryItem label="Pace" value={profile.pacePreference} />
            </CardContent>
          </Card>

          <Card className="subtle-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Proposed program pipeline
              </CardTitle>
              <CardDescription>
                Your program will be generated as a background workflow with live progress, partial module availability, and reconnect-safe state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Iterative agent pipeline (plan → gather → draft → review → persist)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Real-time event stream with persistent job timeline</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Immediate lesson availability before full build completion</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Retry-safe recovery for partial failures</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateProgram}
              disabled={isLoading || isGeneratingProgram}
              className="min-w-[220px]"
            >
              {isGeneratingProgram ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGeneratingProgram ? 'Generating program…' : 'Generate my program'}
            </Button>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Start over
            </Link>
          </div>

          {renderBuildPanel()}
        </div>
      </AppShell>
    )
  }

  if (!sessionId) {
    return (
      <AppShell nav={productNav} currentPath="/admissions" status={shellStatus}>
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="text-center">
            <CardHeader className="items-center">
              <div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <CardTitle>Start admissions</CardTitle>
              <CardDescription>
                Begin your learning journey with a calm interview. The system will convert goals into a complete program in the background.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleStart} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {isLoading ? 'Starting...' : 'Start admission interview'}
              </Button>
            </CardContent>
          </Card>

          {renderBuildPanel()}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell nav={productNav} currentPath="/admissions" status={shellStatus}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Admissions interview"
          subtitle="One question at a time. Clear answers produce a better program."
          actions={<Badge variant="muted">Question {currentQuestion?.questionNumber || 1}</Badge>}
        />

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                <span>Admissions interview</span>
                <span>Question {currentQuestion?.questionNumber || 1}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(currentQuestion?.progress || 0) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">{currentQuestion?.question}</h2>
              {currentQuestion?.rationale && (
                <p className="mb-6 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                  {currentQuestion.rationale}
                </p>
              )}
            </div>

            <div className="mb-8">
              {currentQuestion?.type === 'select' ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setAnswer(option)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                        answer === option
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full resize-none"
                  rows={4}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || isLoading}
                className="min-w-[180px]"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : 'Continue'}
                {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </Link>
            </div>
          </CardContent>
        </Card>

        {renderBuildPanel()}
      </div>
    </AppShell>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/70 py-3">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}
