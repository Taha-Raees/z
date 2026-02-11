import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdmissionsOfficerAgent } from '@/lib/agents/admissions-officer'
import { resolveActiveUser } from '@/lib/user'

export async function POST() {
  try {
    const user = await resolveActiveUser()

    // Create onboarding session
    const session = await prisma.onboardingSession.create({
      data: {
        userId: user.id,
        status: 'ACTIVE',
      },
    })

    // Initialize admissions agent
    const agent = getAdmissionsOfficerAgent()
    const state = await agent.initializeSession()

    // Get first question
    const firstQuestion = state.currentQuestion

    return NextResponse.json({
      sessionId: session.id,
      currentQuestion: {
        ...firstQuestion,
        questionNumber: 1,
        progress: 0,
      },
    })
  } catch (error) {
    console.error('Error starting admissions:', error)
    return NextResponse.json(
      { error: 'Failed to start admissions' },
      { status: 500 }
    )
  }
}
