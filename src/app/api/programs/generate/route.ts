import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StudentOnboardingProfileSchema } from '@/lib/schemas'
import { resolveActiveUser } from '@/lib/user'
import {
  appendBuildEvent,
  createBuildJob,
  getLatestActiveBuildJobByUser,
} from '@/lib/workflows/program-build-store'
import { enqueueProgramBuildJob } from '@/lib/workflows/program-build-runner'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = StudentOnboardingProfileSchema.safeParse(body?.profile)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid onboarding profile',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const profile = parsed.data

    const user = await resolveActiveUser()

    // Reuse active job if one exists
    const activeJob = await getLatestActiveBuildJobByUser(user.id)
    if (activeJob) {
      return NextResponse.json(
        {
          success: true,
          reused: true,
          jobId: activeJob.id,
          programId: activeJob.programId,
          status: activeJob.status,
        },
        { status: 202 }
      )
    }

    const created = await createBuildJob({
      userId: user.id,
      profile,
      topic: profile.topic,
      goalLevel: profile.goalLevel,
      targetDate: profile.targetDate,
      hoursPerDay: Math.round(profile.hoursPerDay),
      currentLevel: profile.currentLevel,
      contentLanguage: profile.contentLanguage,
      instructionLanguage: profile.instructionLanguage,
      strictTargetLanguage: profile.strictTargetLanguage,
    })

    await appendBuildEvent(created.jobId, {
      type: 'job.queued',
      step: 'Queue',
      status: 'PENDING',
      message: 'Program build job queued',
      payload: {
        programId: created.programId,
      },
    })

    await enqueueProgramBuildJob(created.jobId)

    return NextResponse.json({
      success: true,
      jobId: created.jobId,
      programId: created.programId,
      status: 'QUEUED',
    })
  } catch (error) {
    console.error('Error generating program:', error)
    return NextResponse.json(
      { error: 'Failed to generate program' },
      { status: 500 }
    )
  }
}
