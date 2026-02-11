import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdmissionsOfficerAgent } from '@/lib/agents/admissions-officer'
import { resolveLanguagePolicy } from '@/lib/language'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, questionKey, answer } = body

    // Get session
    const session = await prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      include: { answers: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get current state
    const currentState = {
      answers: session.answers.reduce((acc: any, a: any) => {
        acc[a.questionKey] = JSON.parse(a.answerJson)
        return acc
      }, {}),
      completedQuestions: session.answers.map((a: any) => a.questionKey),
      currentQuestion: null,
      isComplete: false,
    }

    // Process answer with agent
    const agent = getAdmissionsOfficerAgent()
    const newState = await agent.processAnswer(currentState, questionKey, answer)

    // Save answer
    await prisma.onboardingAnswer.create({
      data: {
        sessionId,
        questionKey,
        answerJson: JSON.stringify(answer),
      },
    })

    // Update session if complete
    if (newState.isComplete) {
      await prisma.onboardingSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETE',
          completedAt: new Date(),
        },
      })

      // Generate final profile
      const profile = await agent.generateProfile(newState)

      const policy = resolveLanguagePolicy({
        contentLanguage: profile.contentLanguage,
        instructionLanguage: profile.instructionLanguage,
        strictTargetLanguage: profile.strictTargetLanguage,
      })

      await prisma.studentProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          timezone: 'UTC',
          preferencesJson: JSON.stringify({
            contentLanguage: policy.contentLanguage,
            instructionLanguage: policy.instructionLanguage,
            strictTargetLanguage: policy.strictTargetLanguage,
          }),
        },
        update: {
          preferencesJson: JSON.stringify({
            contentLanguage: policy.contentLanguage,
            instructionLanguage: policy.instructionLanguage,
            strictTargetLanguage: policy.strictTargetLanguage,
          }),
        },
      })

      return NextResponse.json({
        isComplete: true,
        profile,
      })
    }

    // Get next question
    const nextQuestion = newState.currentQuestion
    const totalQuestions = 8 // Approximate total
    const completedCount = newState.completedQuestions.length

    return NextResponse.json({
      isComplete: false,
      nextQuestion: {
        ...nextQuestion,
        questionNumber: completedCount + 1,
        progress: completedCount / totalQuestions,
      },
    })
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
