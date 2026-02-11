import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs
 * List recent program build jobs with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const programId = searchParams.get('programId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: any = {}
    if (userId) where.userId = userId
    if (programId) where.programId = programId
    if (status) where.status = status.toUpperCase()

    const jobs = await prisma.programBuildJob.findMany({
      where,
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
    })

    const total = await prisma.programBuildJob.count({ where })

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
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
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + jobs.length < total,
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

