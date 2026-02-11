import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLatestBuildJobByProgram, getProgramBuildView } from '@/lib/workflows/program-build-store'

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function mapProgram(program: any) {
  return {
    id: program.id,
    topic: program.topic,
    goal: program.goal,
    currentLevel: program.currentLevel,
    status: program.status,
    targetDate: program.targetDate,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    modules: program.modules.map((module: any) => ({
      id: module.id,
      index: module.index,
      title: module.title,
      buildStatus: module.buildStatus,
      buildError: module.buildError,
      outcomes: parseJson<string[]>(module.outcomesJson) ?? [],
      lessons: module.lessons.map((lesson: any) => ({
        id: lesson.id,
        index: lesson.index,
        title: lesson.title,
        buildStatus: lesson.buildStatus,
        buildError: lesson.buildError,
        estimatedMinutes: lesson.estimatedMinutes,
        objectives: parseJson<string[]>(lesson.objectivesJson) ?? [],
        resources: lesson.resources.map((resource: any) => ({
          id: resource.id,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          qualityScore: resource.qualityScore,
          durationSeconds: resource.durationSeconds,
        })),
        notes: lesson.notes
          ? {
              id: lesson.notes.id,
              summary: lesson.notes.contentMarkdown,
              glossary: parseJson(lesson.notes.glossaryJson) ?? [],
            }
          : null,
        exerciseSet: lesson.exerciseSets[0]
          ? {
              id: lesson.exerciseSets[0].id,
              schemaVersion: lesson.exerciseSets[0].schemaVersion,
              createdAt: lesson.exerciseSets[0].createdAt,
              content: parseJson(lesson.exerciseSets[0].contentJson),
            }
          : null,
      })),
    })),
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const program = await prisma.program.findUnique({
      where: { id },
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
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const latestJob = await getLatestBuildJobByProgram(id)
    const buildSnapshot = latestJob ? await getProgramBuildView(latestJob.id) : null

    return NextResponse.json({
      success: true,
      program: mapProgram(buildSnapshot?.program ?? program),
      latestBuildJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            currentPhase: latestJob.currentPhase,
            currentItem: latestJob.currentItem,
            totalModules: latestJob.totalModules,
            completedModules: latestJob.completedModules,
            totalLessons: latestJob.totalLessons,
            completedLessons: latestJob.completedLessons,
            retryCount: latestJob.retryCount,
            maxRetries: latestJob.maxRetries,
            error: latestJob.error,
            startedAt: latestJob.startedAt,
            finishedAt: latestJob.finishedAt,
            lastEventIndex: latestJob.lastEventIndex,
            isWorking: latestJob.status === 'QUEUED' || latestJob.status === 'RUNNING',
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch program',
      },
      { status: 500 }
    )
  }
}

