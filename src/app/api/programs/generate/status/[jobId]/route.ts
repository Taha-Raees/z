import { NextResponse } from 'next/server'
import { getBuildJobOrThrow, getProgramBuildView } from '@/lib/workflows/program-build-store'

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

export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params

    const snapshot = await getProgramBuildView(jobId)
    if (!snapshot) {
      return NextResponse.json({ error: 'Build job not found' }, { status: 404 })
    }

    const job = await getBuildJobOrThrow(jobId)

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        programId: job.programId,
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
        lastEventIndex: job.lastEventIndex,
        isWorking: job.status === 'QUEUED' || job.status === 'RUNNING',
      },
      program: mapProgram(snapshot.program),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get build status',
      },
      { status: 500 }
    )
  }
}

