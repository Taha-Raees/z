import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTutorAgent } from '@/lib/agents/tutor'
import { resolveLanguagePolicy } from '@/lib/language'
import { resolveActiveUser } from '@/lib/user'

type TutorAskPayload = {
  question?: string
  lessonId?: string
  context?: string
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
    const body = (await request.json()) as TutorAskPayload

    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const lessonId = typeof body.lessonId === 'string' ? body.lessonId : null
    const context = typeof body.context === 'string' ? body.context : undefined

    if (!question) {
      return NextResponse.json(
        {
          error: 'question is required',
        },
        { status: 400 }
      )
    }

    const user = await resolveActiveUser()

    const tutor = getTutorAgent()

    let responseText = ''
    let grounding: {
      lessonId: string | null
      lessonTitle: string | null
      objectives: string[]
    } = {
      lessonId: null,
      lessonTitle: null,
      objectives: [],
    }

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              program: true,
            },
          },
          notes: true,
        },
      })

      if (lesson) {
        const objectives = parseJson<string[]>(lesson.objectivesJson) ?? []
        const policy = resolveLanguagePolicy({
          contentLanguage: lesson.module.program.contentLanguage,
          instructionLanguage: lesson.module.program.instructionLanguage,
          strictTargetLanguage: lesson.module.program.strictTargetLanguage,
        })

        grounding = {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          objectives,
        }

        responseText = await tutor.provideLessonHelp(
          `${lesson.module.program.topic} / ${lesson.title}`,
          objectives,
          question,
          context ?? lesson.notes?.contentMarkdown ?? undefined,
          policy
        )
      } else {
        responseText = await tutor.answerQuestion(question, context, {
          contentLanguage: 'English',
          instructionLanguage: 'English',
          strictTargetLanguage: false,
        })
      }
    } else {
      responseText = await tutor.answerQuestion(question, context, {
        contentLanguage: 'English',
        instructionLanguage: 'English',
        strictTargetLanguage: false,
      })
    }

    await prisma.agentRun.create({
      data: {
        userId: user.id,
        agentName: 'Tutor',
        status: 'COMPLETED',
        inputJson: JSON.stringify({
          question,
          lessonId,
          context,
        }),
        outputJson: JSON.stringify({
          response: responseText,
          grounding,
        }),
        finishedAt: new Date(),
        traceId: `tutor-${Date.now()}`,
      },
    })

    return NextResponse.json({
      success: true,
      response: responseText,
      grounding,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to ask tutor',
      },
      { status: 500 }
    )
  }
}
