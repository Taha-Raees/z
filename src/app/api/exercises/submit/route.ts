import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGraderAgent } from '@/lib/agents/grader'
import { resolveActiveUser } from '@/lib/user'

type SubmitExercisePayload = {
  exerciseSetId?: string
  answers?: unknown
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitExercisePayload
    const exerciseSetId = typeof body.exerciseSetId === 'string' ? body.exerciseSetId : null
    const answers = Array.isArray(body.answers) ? body.answers : null

    if (!exerciseSetId || !answers) {
      return NextResponse.json(
        {
          error: 'exerciseSetId and answers[] are required',
        },
        { status: 400 }
      )
    }

    const user = await resolveActiveUser()

    const exerciseSet = await prisma.exerciseSet.findUnique({
      where: { id: exerciseSetId },
      include: {
        lesson: {
          include: {
            module: {
              include: { program: true },
            },
          },
        },
      },
    })

    if (!exerciseSet) {
      return NextResponse.json({ error: 'Exercise set not found' }, { status: 404 })
    }

    const content = parseJson<{ questions?: unknown[] }>(exerciseSet.contentJson)
    const questions = Array.isArray(content?.questions) ? content.questions : []

    const grader = getGraderAgent()
    const grading = await grader.gradeObjectiveAssessment(questions as any[], answers)

    const attempt = await prisma.exerciseAttempt.create({
      data: {
        exerciseSetId,
        userId: user.id,
        answersJson: JSON.stringify(answers),
        score: grading.score,
        feedbackJson: JSON.stringify(grading),
      },
    })

    await prisma.progress.upsert({
      where: {
        userId_programId_lessonId_metricKey: {
          userId: user.id,
          programId: exerciseSet.lesson.module.programId,
          lessonId: exerciseSet.lessonId,
          metricKey: 'exercise_score_latest',
        },
      },
      create: {
        userId: user.id,
        programId: exerciseSet.lesson.module.programId,
        lessonId: exerciseSet.lessonId,
        metricKey: 'exercise_score_latest',
        valueNumber: grading.score,
        valueJson: JSON.stringify({
          attemptId: attempt.id,
          score: grading.score,
          passed: grading.passed,
          createdAt: attempt.createdAt,
        }),
      },
      update: {
        valueNumber: grading.score,
        valueJson: JSON.stringify({
          attemptId: attempt.id,
          score: grading.score,
          passed: grading.passed,
          createdAt: attempt.createdAt,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      grading,
      lessonId: exerciseSet.lessonId,
      programId: exerciseSet.lesson.module.programId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit exercise attempt',
      },
      { status: 500 }
    )
  }
}
