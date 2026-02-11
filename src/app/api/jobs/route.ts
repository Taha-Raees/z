import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs
 * List recent jobs with optional filtering (supports both program builds and resource refresh jobs)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const programId = searchParams.get('programId')
    const lessonId = searchParams.get('lessonId')
    const type = searchParams.get('type') // 'program_build' | 'lesson_resource_refresh'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause based on filters
    const where: any = {}
    if (userId) where.userId = userId
    if (programId) where.programId = programId
    if (lessonId) where.lessonId = lessonId
    if (status) where.status = status.toUpperCase()
    if (type) where.type = type.toUpperCase()

    // Fetch both ProgramBuildJob and JobRun records
    const [programBuildJobs, jobRuns] = await Promise.all([
      prisma.programBuildJob.findMany({
        where: type ? { ...where, type: undefined } : where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          program: {
            select: {
              id: true,
              topic: true,
              goal: true,
            },
          },
        },
      }),
      prisma.jobRun.findMany({
        where: type ? { ...where, type: undefined } : where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
    ])

    // Normalize to common format
    const jobs = [
      ...programBuildJobs.map((job) => ({
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
      })),
      ...jobRuns.map((job) => ({
        id: job.id,
        userId: job.userId,
        programId: null,
        program: null,
        type: job.type,
        status: job.status,
        currentPhase: null,
        currentItem: null,
        totalModules: null,
        completedModules: null,
        totalLessons: null,
        completedLessons: null,
        retryCount: 0,
        maxRetries: 0,
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        lastHeartbeatAt: null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        lastEventIndex: null,
      })),
    ]

    // Sort by createdAt desc
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply limit after merging
    const paginatedJobs = jobs.slice(0, limit)

    const total = programBuildJobs.length + jobRuns.length

    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + paginatedJobs.length < total,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      },
      { status: 500 }
    )
  }
}

