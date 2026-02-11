import { NextResponse } from 'next/server'
import {
  appendBuildEvent,
  getBuildJobOrThrow,
  getBuildCheckpoint,
  resetBuildJobForRetry,
  updateBuildJobState,
} from '@/lib/workflows/program-build-store'
import { enqueueProgramBuildJob } from '@/lib/workflows/program-build-runner'

/**
 * POST /api/programs/generate/recover/[jobId]
 * Recover a stale RUNNING job by marking it FAILED and queuing a retry
 */
export async function POST(
  _: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const job = await getBuildJobOrThrow(jobId)

    // Check if job is RUNNING and stale
    if (job.status !== 'RUNNING') {
      return NextResponse.json(
        {
          error: 'Job is not in RUNNING status',
          currentStatus: job.status,
          message: 'Recovery is only available for jobs stuck in RUNNING status',
        },
        { status: 409 }
      )
    }

    // Check if job is stale (no heartbeat for 3+ minutes)
    const STALE_THRESHOLD_MS = 180_000 // 3 minutes
    const heartbeatAt = job.lastHeartbeatAt?.getTime() ?? job.updatedAt.getTime()
    const isStale = Date.now() - heartbeatAt > STALE_THRESHOLD_MS

    if (!isStale) {
      return NextResponse.json(
        {
          error: 'Job heartbeat is not stale',
          lastHeartbeatAt: job.lastHeartbeatAt,
          message: 'Job appears to be actively running. Recovery not needed.',
        },
        { status: 409 }
      )
    }

    // Get current checkpoint before marking as failed
    const checkpoint = await getBuildCheckpoint(jobId)

    // Mark job as FAILED
    await updateBuildJobState(jobId, {
      status: 'FAILED',
      currentPhase: 'failed',
      error: `Job marked as failed for recovery (stale heartbeat)`,
      finishedAt: new Date(),
    })

    await appendBuildEvent(jobId, {
      type: 'job.recovery.started',
      step: 'Recovery',
      status: 'IN_PROGRESS',
      level: 'WARN',
      message: `Job marked as FAILED for recovery. Stale heartbeat detected (${Math.floor(STALE_THRESHOLD_MS / 1000)}s timeout).`,
      payload: {
        checkpoint,
        staleDurationMs: Date.now() - heartbeatAt,
      },
    })

    // Reset job for retry
    const retried = await resetBuildJobForRetry(jobId)

    if (!retried.ok) {
      return NextResponse.json(
        {
          error: retried.reason,
          message: 'Failed to reset job for retry',
        },
        { status: 500 }
      )
    }

    await appendBuildEvent(jobId, {
      type: 'job.recovery.queued',
      step: 'Recovery',
      status: 'PENDING',
      message: `Recovery queued (attempt ${retried.retryCount}/${job.maxRetries}) - will resume from: ${retried.resumeFrom || 'start'}`,
      payload: {
        retryCount: retried.retryCount,
        maxRetries: job.maxRetries,
        resumeFrom: retried.resumeFrom,
        checkpoint,
      },
    })

    // Enqueue the job
    await enqueueProgramBuildJob(jobId)

    return NextResponse.json({
      success: true,
      jobId,
      programId: job.programId,
      status: 'QUEUED',
      retryCount: retried.retryCount,
      maxRetries: job.maxRetries,
      resumeFrom: retried.resumeFrom,
      checkpoint,
      message: 'Job recovered and queued for retry',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to recover job',
      },
      { status: 500 }
    )
  }
}
