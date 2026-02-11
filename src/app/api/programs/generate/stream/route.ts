import { enqueueProgramBuildJob } from '@/lib/workflows/program-build-runner'
import {
  getBuildEventsSince,
  getBuildJobOrThrow,
  getProgramBuildView,
} from '@/lib/workflows/program-build-store'

export const runtime = 'nodejs'

const TERMINAL_JOB_STATES = new Set(['COMPLETED', 'FAILED', 'CANCELED'])

function toSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function mapStepStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'failed' {
  if (status === 'IN_PROGRESS') return 'in_progress'
  if (status === 'COMPLETED') return 'completed'
  if (status === 'FAILED') return 'failed'
  if (status === 'SKIPPED') return 'completed'
  return 'pending'
}

function shouldRefreshProgramView(eventType: string): boolean {
  return (
    eventType.startsWith('module.') ||
    eventType.startsWith('lesson.') ||
    eventType === 'phase.plan.completed' ||
    eventType === 'phase.schedule.completed' ||
    eventType === 'phase.assessments.completed'
  )
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function mapProgramForClient(program: any) {
  return {
    id: program.id,
    topic: program.topic,
    goal: program.goal,
    currentLevel: program.currentLevel,
    status: program.status,
    targetDate: program.targetDate,
    updatedAt: program.updatedAt,
    modules: program.modules.map((module: any) => ({
      id: module.id,
      index: module.index,
      title: module.title,
      buildStatus: module.buildStatus,
      buildError: module.buildError,
      outcomes: module.outcomes,
      lessons: module.lessons.map((lesson: any) => ({
        id: lesson.id,
        index: lesson.index,
        title: lesson.title,
        buildStatus: lesson.buildStatus,
        buildError: lesson.buildError,
        estimatedMinutes: lesson.estimatedMinutes,
        objectives: lesson.objectives,
        resources: lesson.resources.map((resource: any) => ({
          id: resource.id,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          durationSeconds: resource.durationSeconds,
          qualityScore: resource.qualityScore,
        })),
        notes: lesson.notes
          ? {
              id: lesson.notes.id,
              summary: lesson.notes.contentMarkdown,
              glossary: parseJson(lesson.notes.glossaryJson) ?? [],
            }
          : null,
        latestExerciseSet: lesson.latestExerciseSet
          ? {
              id: lesson.latestExerciseSet.id,
              schemaVersion: lesson.latestExerciseSet.schemaVersion,
              createdAt: lesson.latestExerciseSet.createdAt,
              content: lesson.latestExerciseSet.content,
            }
          : null,
      })),
    })),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId : null
  const afterIndex =
    typeof body.afterIndex === 'number' && Number.isFinite(body.afterIndex)
      ? Math.max(0, Math.floor(body.afterIndex))
      : 0

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const encoder = new TextEncoder()
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (cancelled) return
        controller.enqueue(encoder.encode(toSse(event, data)))
      }

      const sendSnapshot = async () => {
        const snapshot = await getProgramBuildView(jobId)
        if (!snapshot) return

        send('status', {
          jobId: snapshot.job.id,
          programId: snapshot.job.programId,
          status: snapshot.job.status,
          currentPhase: snapshot.job.currentPhase,
          currentItem: snapshot.job.currentItem,
          totalModules: snapshot.job.totalModules,
          completedModules: snapshot.job.completedModules,
          totalLessons: snapshot.job.totalLessons,
          completedLessons: snapshot.job.completedLessons,
          retryCount: snapshot.job.retryCount,
          maxRetries: snapshot.job.maxRetries,
          error: snapshot.job.error,
          startedAt: snapshot.job.startedAt,
          finishedAt: snapshot.job.finishedAt,
          lastEventIndex: snapshot.job.lastEventIndex,
          isWorking: snapshot.job.status === 'QUEUED' || snapshot.job.status === 'RUNNING',
        })

        send('partial', {
          jobId: snapshot.job.id,
          programId: snapshot.job.programId,
          program: mapProgramForClient(snapshot.program),
          lastEventIndex: snapshot.job.lastEventIndex,
        })
      }

      try {
        const initialJob = await getBuildJobOrThrow(jobId)
        if (initialJob.status === 'QUEUED' || initialJob.status === 'RUNNING') {
          await enqueueProgramBuildJob(jobId)
        }

        let currentIndex = afterIndex

        await sendSnapshot()

        const initialEvents = await getBuildEventsSince(jobId, currentIndex)
        for (const event of initialEvents) {
          send('progress', {
            index: event.index,
            type: event.type,
            step: event.step,
            status: mapStepStatus(event.status),
            rawStatus: event.status,
            level: event.level,
            message: event.message,
            payload: event.payload,
            timestamp: event.createdAt.toISOString(),
            isWorking: event.status === 'IN_PROGRESS',
          })

          currentIndex = event.index
        }

        if (initialEvents.some((event: { type: string }) => shouldRefreshProgramView(event.type))) {
          await sendSnapshot()
        }

        while (!cancelled) {
          const job = await getBuildJobOrThrow(jobId)
          if (job.status === 'QUEUED' || job.status === 'RUNNING') {
            await enqueueProgramBuildJob(jobId)
          }

          const events = await getBuildEventsSince(jobId, currentIndex)
          let refreshProgram = false

          for (const event of events) {
            send('progress', {
              index: event.index,
              type: event.type,
              step: event.step,
              status: mapStepStatus(event.status),
              rawStatus: event.status,
              level: event.level,
              message: event.message,
              payload: event.payload,
              timestamp: event.createdAt.toISOString(),
              isWorking: event.status === 'IN_PROGRESS',
            })

            currentIndex = event.index
            if (shouldRefreshProgramView(event.type)) {
              refreshProgram = true
            }
          }

          if (refreshProgram) {
            await sendSnapshot()
          }

          if (TERMINAL_JOB_STATES.has(job.status)) {
            await sendSnapshot()

            if (job.status === 'COMPLETED') {
              send('complete', {
                success: true,
                jobId: job.id,
                programId: job.programId,
                status: job.status,
                lastEventIndex: job.lastEventIndex,
              })
            }

            if (job.status === 'FAILED' || job.status === 'CANCELED') {
              send('error', {
                error: job.error || `Program generation ended with status ${job.status}`,
                jobId: job.id,
                programId: job.programId,
                status: job.status,
                lastEventIndex: job.lastEventIndex,
              })
            }

            send('done', {
              success: job.status === 'COMPLETED',
              jobId: job.id,
              programId: job.programId,
              status: job.status,
              lastEventIndex: job.lastEventIndex,
            })

            controller.close()
            return
          }

          await sleep(900)
        }
      } catch (error) {
        send('error', {
          error: error instanceof Error ? error.message : 'Failed to generate program',
          jobId,
        })
        send('done', { success: false, jobId })
        controller.close()
      }
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
