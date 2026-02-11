import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'

type DailyPlanItem = {
  id: string
  type: string
  estimatedMinutes: number
  status: string
  refId: string | null
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function endOfToday(): Date {
  const start = startOfToday()
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
}

export async function GET() {
  try {
    const user = await resolveActiveUser()

    const activeProgram = await prisma.program.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'DRAFT'] },
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!activeProgram) {
      return NextResponse.json({
        success: true,
        date: new Date().toISOString(),
        totalEstimatedMinutes: 0,
        items: [],
        notes: 'No active program found for this student.',
      })
    }

    const schedule = await prisma.schedule.findFirst({
      where: { programId: activeProgram.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          where: {
            date: {
              gte: startOfToday(),
              lt: endOfToday(),
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    const rawItems: DailyPlanItem[] = schedule?.items.map((item) => ({
      id: item.id,
      type: item.type,
      estimatedMinutes: item.estimatedMinutes,
      status: item.status,
      refId: item.refId,
    })) ?? []

    const items = rawItems.sort((a, b) => {
      const pendingRank = (status: string) =>
        status === 'PENDING' ? 0 : status === 'IN_PROGRESS' ? 1 : 2
      return pendingRank(a.status) - pendingRank(b.status)
    })

    const totalEstimatedMinutes = items.reduce((acc, item) => acc + item.estimatedMinutes, 0)

    return NextResponse.json({
      success: true,
      programId: activeProgram.id,
      programTopic: activeProgram.topic,
      date: new Date().toISOString(),
      totalEstimatedMinutes,
      items,
      notes:
        items.length === 0
          ? 'No scheduled items for today. Use calendar/program page to plan next activities.'
          : 'Today prioritizes unfinished activities first. Review blocks should be inserted if repeated low scores are detected.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate daily plan',
      },
      { status: 500 }
    )
  }
}
