import { NextResponse } from 'next/server'
import {
  appendBuildEvent,
  getBuildJobOrThrow,
  getBuildCheckpoint,
  resetBuildJobForRetry,
} from '@/lib/workflows/program-build-store'
import { enqueueProgramBuildJob } from '@/lib/workflows/program-build-runner'

export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params
    const job = await getBuildJobOrThrow(jobId)

    // Get current checkpoint before resetting
    const checkpoint = await getBuildCheckpoint(jobId)

    const retried = await resetBuildJobForRetry(jobId)

    if (!retried.ok) {
      const messageMap: Record<string, string> = {
        not_found: 'Build job not found',
        invalid_status: 'Only FAILED jobs can be retried',
        max_retries_reached: `Retry limit reached (${job.maxRetries})`,
      }

      return NextResponse.json(
        {
          error: messageMap[retried.reason] ?? 'Cannot retry this build job',
          reason: retried.reason,
          status: job.status,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
        },
        { status: 409 }
      )
    }

    await appendBuildEvent(jobId, {
      type: 'job.retry.queued',
      step: 'Queue',
      status: 'PENDING',
      message: `Retry queued (attempt ${retried.retryCount}/${job.maxRetries}) - will resume from: ${retried.resumeFrom || 'start'}`,
      payload: {
        retryCount: retried.retryCount,
        maxRetries: job.maxRetries,
        resumeFrom: retried.resumeFrom,
        checkpoint,
      },
    })

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
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry build job',
      },
      { status: 500 }
    )
  }
}

