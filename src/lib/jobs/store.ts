/**
 * Job Run Store
 * Generic job logging and management for v0.2 engine
 */

import { prisma } from '../prisma'
import type { JobStatus, JobStepStatus } from '@prisma/client'

export type JobType = 
  | 'program_build' 
  | 'daily_run' 
  | 'lesson_generate' 
  | 'practice_generate' 
  | 'review_generate'
  | 'assessment_generate'
  | 'grading'

export interface CreateJobInput {
  userId: string
  type: JobType
  input?: Record<string, unknown>
}

export interface JobStepInput {
  stepName: string
  status: JobStepStatus
  message?: string
  data?: Record<string, unknown>
  durationMs?: number
}

/**
 * Create a new job run
 */
export async function createJobRun(input: CreateJobInput): Promise<string> {
  const job = await prisma.jobRun.create({
    data: {
      userId: input.userId,
      type: input.type,
      status: 'READY',
      inputJson: JSON.stringify(input.input ?? {}),
      outputJson: '{}',
    },
  })
  return job.id
}

/**
 * Get a job by ID
 */
export async function getJobRun(jobId: string) {
  return prisma.jobRun.findUnique({
    where: { id: jobId },
    include: { steps: { orderBy: { timestamp: 'asc' } } },
  })
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string,
  errorCode?: string
): Promise<void> {
  const data: Record<string, unknown> = { status }
  
  if (error !== undefined) data.error = error
  if (errorCode !== undefined) data.errorCode = errorCode
  if (status === 'RUNNING' && !data.startedAt) data.startedAt = new Date()
  if ((status === 'DONE' || status === 'ERROR') && !data.finishedAt) {
    data.finishedAt = new Date()
  }

  await prisma.jobRun.update({
    where: { id: jobId },
    data,
  })
}

/**
 * Set job output
 */
export async function setJobOutput(
  jobId: string,
  output: Record<string, unknown>
): Promise<void> {
  await prisma.jobRun.update({
    where: { id: jobId },
    data: { outputJson: JSON.stringify(output) },
  })
}

/**
 * Add a step to a job
 */
export async function addJobStep(
  jobId: string,
  step: JobStepInput
): Promise<void> {
  await prisma.jobStep.create({
    data: {
      jobId,
      stepName: step.stepName,
      status: step.status,
      message: step.message,
      dataJson: JSON.stringify(step.data ?? {}),
      durationMs: step.durationMs,
    },
  })
}

/**
 * List recent jobs for a user
 */
export async function listJobRuns(
  userId: string,
  options?: {
    type?: JobType
    status?: JobStatus
    limit?: number
    offset?: number
  }
) {
  const where: Record<string, unknown> = { userId }
  
  if (options?.type) where.type = options.type
  if (options?.status) where.status = options.status

  const [jobs, total] = await Promise.all([
    prisma.jobRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      include: {
        steps: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.jobRun.count({ where }),
  ])

  return { jobs, total }
}

/**
 * Get job with full step details
 */
export async function getJobRunDetails(jobId: string) {
  const job = await prisma.jobRun.findUnique({
    where: { id: jobId },
    include: { steps: { orderBy: { timestamp: 'asc' } } },
  })

  if (!job) return null

  return {
    ...job,
    input: safeParseJson(job.inputJson),
    output: safeParseJson(job.outputJson),
    steps: job.steps.map(step => ({
      ...step,
      data: safeParseJson(step.dataJson),
    })),
  }
}

/**
 * Get steps for a job
 */
export async function getJobSteps(jobId: string) {
  const steps = await prisma.jobStep.findMany({
    where: { jobId },
    orderBy: { timestamp: 'asc' },
  })

  return steps.map(step => ({
    ...step,
    data: safeParseJson(step.dataJson),
  }))
}

/**
 * Mark job as running
 */
export async function markJobRunning(jobId: string): Promise<void> {
  await updateJobStatus(jobId, 'RUNNING')
  await addJobStep(jobId, {
    stepName: 'job.started',
    status: 'IN_PROGRESS',
    message: 'Job started',
  })
}

/**
 * Mark job as completed
 */
export async function markJobCompleted(
  jobId: string,
  output?: Record<string, unknown>
): Promise<void> {
  if (output) {
    await setJobOutput(jobId, output)
  }
  await updateJobStatus(jobId, 'DONE')
  await addJobStep(jobId, {
    stepName: 'job.completed',
    status: 'COMPLETED',
    message: 'Job completed successfully',
  })
}

/**
 * Mark job as failed
 */
export async function markJobFailed(
  jobId: string,
  error: string,
  errorCode?: string
): Promise<void> {
  await updateJobStatus(jobId, 'ERROR', error, errorCode)
  await addJobStep(jobId, {
    stepName: 'job.failed',
    status: 'FAILED',
    message: error,
    data: errorCode ? { errorCode } : undefined,
  })
}

/**
 * Mark job as needing input
 */
export async function markJobNeedsInput(
  jobId: string,
  message: string,
  promptData?: Record<string, unknown>
): Promise<void> {
  await updateJobStatus(jobId, 'NEEDS_INPUT')
  await addJobStep(jobId, {
    stepName: 'job.needs_input',
    status: 'PENDING',
    message,
    data: promptData,
  })
}

/**
 * Helper to safely parse JSON
 */
function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
