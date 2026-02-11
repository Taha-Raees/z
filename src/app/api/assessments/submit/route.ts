import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGraderAgent } from '@/lib/agents/grader'
import { resolveActiveUser } from '@/lib/user'

type SubmitAssessmentPayload = {
  assessmentId?: string
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
    const body = (await request.json()) as SubmitAssessmentPayload
    const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId : null
    const answers = Array.isArray(body.answers) ? body.answers : null

    if (!assessmentId || !answers) {
      return NextResponse.json(
        {
          error: 'assessmentId and answers[] are required',
        },
        { status: 400 }
      )
    }

    const user = await resolveActiveUser()

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        program: true,
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const questionPayload = parseJson<unknown[]>(assessment.contentJson)
    const questions = Array.isArray(questionPayload) ? questionPayload : []

    const grader = getGraderAgent()
    const grading = await grader.gradeObjectiveAssessment(questions as any[], answers)

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        userId: user.id,
        answersJson: JSON.stringify(answers),
        score: grading.score,
        feedbackJson: JSON.stringify(grading),
        submittedAt: new Date(),
        gradedAt: new Date(),
      },
    })

    const metricKey =
      assessment.type === 'QUIZ'
        ? 'assessment_quiz_latest'
        : assessment.type === 'TEST'
          ? 'assessment_test_latest'
          : 'assessment_exam_latest'

    await prisma.progress.upsert({
      where: {
        userId_programId_lessonId_metricKey: {
          userId: user.id,
          programId: assessment.programId,
          lessonId: '',
          metricKey,
        },
      },
      create: {
        userId: user.id,
        programId: assessment.programId,
        lessonId: '',
        metricKey,
        valueNumber: grading.score,
        valueJson: JSON.stringify({
          assessmentId: assessment.id,
          assessmentType: assessment.type,
          attemptId: attempt.id,
          score: grading.score,
          passed: grading.passed,
          submittedAt: attempt.submittedAt,
        }),
      },
      update: {
        valueNumber: grading.score,
        valueJson: JSON.stringify({
          assessmentId: assessment.id,
          assessmentType: assessment.type,
          attemptId: attempt.id,
          score: grading.score,
          passed: grading.passed,
          submittedAt: attempt.submittedAt,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      assessmentId: assessment.id,
      programId: assessment.programId,
      grading,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit assessment attempt',
      },
      { status: 500 }
    )
  }
}
