import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBuildEventsSince } from '@/lib/workflows/program-build-store'

/**
 * GET /api/jobs/[id]
 * Get job details with events (supports both ProgramBuildJob and JobRun)
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find as ProgramBuildJob first
    const programBuildJob = await prisma.programBuildJob.findUnique({
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

    if (programBuildJob) {
      // Get recent events for ProgramBuildJob
      const events = await getBuildEventsSince(id, Math.max(0, programBuildJob.lastEventIndex - 50))

      return NextResponse.json({
        success: true,
        job: {
          id: programBuildJob.id,
          userId: programBuildJob.userId,
          programId: programBuildJob.programId,
          program: programBuildJob.program,
          type: 'program_build',
          status: programBuildJob.status,
          currentPhase: programBuildJob.currentPhase,
          currentItem: programBuildJob.currentItem,
          totalModules: programBuildJob.totalModules,
          completedModules: programBuildJob.completedModules,
          totalLessons: programBuildJob.totalLessons,
          completedLessons: programBuildJob.completedLessons,
          retryCount: programBuildJob.retryCount,
          maxRetries: programBuildJob.maxRetries,
          error: programBuildJob.error,
          startedAt: programBuildJob.startedAt,
          finishedAt: programBuildJob.finishedAt,
          lastHeartbeatAt: programBuildJob.lastHeartbeatAt,
          createdAt: programBuildJob.createdAt,
          updatedAt: programBuildJob.updatedAt,
          lastEventIndex: programBuildJob.lastEventIndex,
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
    }

    // Try to find as JobRun
    const jobRun = await prisma.jobRun.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    })

    if (jobRun) {
      return NextResponse.json({
        success: true,
        job: {
          id: jobRun.id,
          userId: jobRun.userId,
          programId: jobRun.programId,
          lessonId: jobRun.lessonId,
          type: jobRun.type,
          status: jobRun.status,
          currentPhase: null,
          currentItem: null,
          totalModules: null,
          completedModules: null,
          totalLessons: null,
          completedLessons: null,
          retryCount: 0,
          maxRetries: 0,
          error: jobRun.error,
          startedAt: jobRun.startedAt,
          finishedAt: jobRun.finishedAt,
          lastHeartbeatAt: null,
          createdAt: jobRun.createdAt,
          updatedAt: jobRun.updatedAt,
          lastEventIndex: null,
        },
        events: jobRun.steps.map((step) => ({
          id: step.id,
          index: 0,
          type: step.stepName,
          step: step.stepName,
          status: step.status,
          level: 'INFO',
          message: step.message,
          payload: JSON.parse(step.dataJson || '{}'),
          createdAt: step.timestamp,
        })),
        eventCount: jobRun.steps.length,
      })
    }

    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch job details',
      },
      { status: 500 }
    )
  }
}
