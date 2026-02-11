import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBuildEventsSince } from '@/lib/workflows/program-build-store'

/**
 * GET /api/jobs/[id]
 * Get job details with events
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const job = await prisma.programBuildJob.findUnique({
      where: { id },
      include: {
        program: {
          select: {
            id: true,
            topic: true,
            goal: true,
            currentLevel: true,
            targetDate: true,
            status: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get recent events
    const events = await getBuildEventsSince(id, Math.max(0, job.lastEventIndex - 50))

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        userId: job.userId,
        programId: job.programId,
        program: job.program,
        type: 'program_build',
        status: job.status,
        currentPhase: job.currentPhase,
        currentItem: job.currentItem,
        totalModules: job.totalModules,
        completedModules: job.completedModules,
        totalLessons: job.totalLessons,
        completedLessons: job.completedLessons,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        lastHeartbeatAt: job.lastHeartbeatAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        lastEventIndex: job.lastEventIndex,
      },
      events: events.map((event) => ({
        id: event.id,
        index: event.index,
        type: event.type,
        step: event.step,
        status: event.status,
        level: event.level,
        message: event.message,
        payload: event.payload,
        createdAt: event.createdAt,
      })),
      eventCount: events.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch job details',
      },
      { status: 500 }
    )
  }
}
