import { type BuildEventLevel, type BuildJobStatus, type BuildStepStatus } from '@prisma/client'
import { prisma } from '../prisma'
import type { StudentOnboardingProfile, ProgramBlueprint } from '../schemas'

const RUNNING_HEARTBEAT_STALE_MS = 180_000

export type BuildEventInput = {
  type: string
  step: string
  status: BuildStepStatus
  level?: BuildEventLevel
  message?: string
  payload?: unknown
}

export async function createBuildJob(input: {
  userId: string
  profile: StudentOnboardingProfile
  topic: string
  goalLevel: string
  targetDate: string
  hoursPerDay: number
  currentLevel: string
  contentLanguage: string
  instructionLanguage: string
  strictTargetLanguage: boolean
}): Promise<{ jobId: string; programId: string }> {
  const created = await prisma.$transaction(async (tx) => {
    const program = await tx.program.create({
      data: {
        userId: input.userId,
        topic: input.topic,
        goal: input.goalLevel,
        targetDate: new Date(input.targetDate),
        hoursPerDay: input.hoursPerDay,
        currentLevel: input.currentLevel,
        contentLanguage: input.contentLanguage,
        instructionLanguage: input.instructionLanguage,
        strictTargetLanguage: input.strictTargetLanguage,
        status: 'DRAFT',
        version: 1,
      },
    })

    const job = await tx.programBuildJob.create({
      data: {
        userId: input.userId,
        programId: program.id,
        status: 'QUEUED',
        inputProfileJson: JSON.stringify(input.profile),
        currentPhase: 'queued',
        currentItem: null,
      },
    })

    return { jobId: job.id, programId: program.id }
  })

  return created
}

export async function getLatestActiveBuildJobByUser(userId: string) {
  return prisma.programBuildJob.findFirst({
    where: {
      userId,
      status: {
        in: ['QUEUED', 'RUNNING'],
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBuildJobOrThrow(jobId: string) {
  const job = await prisma.programBuildJob.findUnique({
    where: { id: jobId },
  })

  if (!job) {
    throw new Error(`Build job not found: ${jobId}`)
  }

  return job
}

export async function claimBuildJob(
  jobId: string,
  options: { allowStealStaleRunning?: boolean; staleMs?: number } = {
    allowStealStaleRunning: false,
    staleMs: RUNNING_HEARTBEAT_STALE_MS,
  }
): Promise<'claimed' | 'already_running' | 'already_finished'> {
  const job = await getBuildJobOrThrow(jobId)

  if (job.status === 'RUNNING') {
    const staleMs = options.staleMs ?? RUNNING_HEARTBEAT_STALE_MS
    const heartbeatAt = job.lastHeartbeatAt?.getTime() ?? job.updatedAt.getTime()
    const isStale = Date.now() - heartbeatAt > staleMs

    if (!options.allowStealStaleRunning || !isStale) {
      return 'already_running'
    }
  }

  if (job.status === 'COMPLETED' || job.status === 'CANCELED') return 'already_finished'

  await prisma.programBuildJob.update({
    where: { id: jobId },
    data: {
      status: 'RUNNING',
      startedAt: job.startedAt ?? new Date(),
      lastHeartbeatAt: new Date(),
      error: null,
    },
  })

  return 'claimed'
}

export async function markBuildJobFailedIfStale(
  jobId: string,
  staleMs: number = RUNNING_HEARTBEAT_STALE_MS
): Promise<boolean> {
  const job = await prisma.programBuildJob.findUnique({
    where: { id: jobId },
  })

  if (!job) return false
  if (job.status !== 'RUNNING') return false

  const heartbeatAt = job.lastHeartbeatAt?.getTime() ?? job.updatedAt.getTime()
  const isStale = Date.now() - heartbeatAt > staleMs
  if (!isStale) return false

  await prisma.programBuildJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      currentPhase: 'failed',
      error: `Build heartbeat stale for more than ${Math.floor(staleMs / 1000)}s`,
      finishedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
  })

  await appendBuildEvent(jobId, {
    type: 'job.failed.stale_heartbeat',
    step: 'Recovery',
    status: 'FAILED',
    level: 'ERROR',
    message: `Build marked as failed due to stale heartbeat (${Math.floor(staleMs / 1000)}s timeout).`,
  })

  return true
}

export async function getLatestBuildJobByProgram(programId: string) {
  return prisma.programBuildJob.findFirst({
    where: { programId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function resetBuildJobForRetry(jobId: string): Promise<
  | { ok: true; retryCount: number }
  | { ok: false; reason: 'not_found' | 'invalid_status' | 'max_retries_reached' }
> {
  const job = await prisma.programBuildJob.findUnique({ where: { id: jobId } })
  if (!job) {
    return { ok: false, reason: 'not_found' }
  }

  if (job.status !== 'FAILED') {
    return { ok: false, reason: 'invalid_status' }
  }

  if (job.retryCount >= job.maxRetries) {
    return { ok: false, reason: 'max_retries_reached' }
  }

  const updated = await prisma.programBuildJob.update({
    where: { id: jobId },
    data: {
      status: 'QUEUED',
      currentPhase: 'queued',
      currentItem: null,
      error: null,
      startedAt: null,
      finishedAt: null,
      lastHeartbeatAt: null,
      retryCount: {
        increment: 1,
      },
    },
  })

  return { ok: true, retryCount: updated.retryCount }
}

export async function updateBuildJobState(jobId: string, patch: {
  status?: BuildJobStatus
  currentPhase?: string | null
  currentItem?: string | null
  totalModules?: number
  completedModules?: number
  totalLessons?: number
  completedLessons?: number
  retryCount?: number
  planJson?: unknown
  error?: string | null
  startedAt?: Date | null
  finishedAt?: Date | null
  lastHeartbeatAt?: Date | null
}): Promise<void> {
  const data: Record<string, unknown> = {}

  if (patch.status !== undefined) data.status = patch.status
  if (patch.currentPhase !== undefined) data.currentPhase = patch.currentPhase
  if (patch.currentItem !== undefined) data.currentItem = patch.currentItem
  if (patch.totalModules !== undefined) data.totalModules = patch.totalModules
  if (patch.completedModules !== undefined) data.completedModules = patch.completedModules
  if (patch.totalLessons !== undefined) data.totalLessons = patch.totalLessons
  if (patch.completedLessons !== undefined) data.completedLessons = patch.completedLessons
  if (patch.retryCount !== undefined) data.retryCount = patch.retryCount
  if (patch.planJson !== undefined) data.planJson = JSON.stringify(patch.planJson)
  if (patch.error !== undefined) data.error = patch.error
  if (patch.startedAt !== undefined) data.startedAt = patch.startedAt
  if (patch.finishedAt !== undefined) data.finishedAt = patch.finishedAt
  if (patch.lastHeartbeatAt !== undefined) data.lastHeartbeatAt = patch.lastHeartbeatAt

  if (Object.keys(data).length === 0) return

  await prisma.programBuildJob.update({
    where: { id: jobId },
    data,
  })
}

export async function appendBuildEvent(jobId: string, input: BuildEventInput): Promise<number> {
  const job = await getBuildJobOrThrow(jobId)
  const nextIndex = job.lastEventIndex + 1

  await prisma.$transaction([
    prisma.programBuildEvent.create({
      data: {
        jobId,
        index: nextIndex,
        type: input.type,
        step: input.step,
        status: input.status,
        level: input.level ?? 'INFO',
        message: input.message,
        payloadJson: JSON.stringify(input.payload ?? {}),
      },
    }),
    prisma.programBuildJob.update({
      where: { id: jobId },
      data: {
        lastEventIndex: nextIndex,
        lastHeartbeatAt: new Date(),
      },
    }),
  ])

  return nextIndex
}

export async function getBuildEventsSince(jobId: string, afterIndex: number) {
  const events = await prisma.programBuildEvent.findMany({
    where: {
      jobId,
      index: { gt: afterIndex },
    },
    orderBy: { index: 'asc' },
  })

  return events.map((event) => ({
    ...event,
    payload: safeParseJson(event.payloadJson),
  }))
}

export async function listProgramBuildJobsByProgram(programId: string) {
  return prisma.programBuildJob.findMany({
    where: { programId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProgramBuildView(jobId: string) {
  const job = await prisma.programBuildJob.findUnique({
    where: { id: jobId },
    include: {
      program: {
        include: {
          modules: {
            orderBy: { index: 'asc' },
            include: {
              lessons: {
                orderBy: { index: 'asc' },
                include: {
                  resources: true,
                  notes: true,
                  exerciseSets: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!job) return null

  return {
    job: {
      ...job,
      inputProfile: safeParseJson(job.inputProfileJson),
      plan: safeParseJson(job.planJson),
    },
    program: {
      ...job.program,
      modules: job.program.modules.map((module) => ({
        ...module,
        outcomes: safeParseJson(module.outcomesJson) ?? [],
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          objectives: safeParseJson(lesson.objectivesJson) ?? [],
          latestExerciseSet: lesson.exerciseSets[0]
            ? {
                ...lesson.exerciseSets[0],
                content: safeParseJson(lesson.exerciseSets[0].contentJson),
              }
            : null,
        })),
      })),
    },
  }
}

export async function persistProgramBlueprint(jobId: string, blueprint: ProgramBlueprint): Promise<void> {
  const job = await getBuildJobOrThrow(jobId)

  await prisma.$transaction(async (tx) => {
    await tx.module.deleteMany({ where: { programId: job.programId } })

    for (const module of blueprint.modules) {
      await tx.module.create({
        data: {
          programId: job.programId,
          index: module.index,
          title: module.title,
          outcomesJson: JSON.stringify(module.outcomes),
          buildStatus: 'PENDING',
        },
      })
    }

    await tx.programBuildJob.update({
      where: { id: jobId },
      data: {
        totalModules: blueprint.modules.length,
        completedModules: 0,
        totalLessons: blueprint.modules.reduce((acc, module) => acc + module.lessonsCount, 0),
        completedLessons: 0,
        planJson: JSON.stringify(blueprint),
      },
    })
  })
}

function safeParseJson(value: string | null | undefined): any {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
