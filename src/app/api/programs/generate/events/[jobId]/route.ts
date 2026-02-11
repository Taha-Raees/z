import { NextResponse } from 'next/server'
import { getBuildEventsSince, getBuildJobOrThrow } from '@/lib/workflows/program-build-store'

function mapStepStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'failed' {
  if (status === 'IN_PROGRESS') return 'in_progress'
  if (status === 'COMPLETED') return 'completed'
  if (status === 'FAILED') return 'failed'
  if (status === 'SKIPPED') return 'completed'
  return 'pending'
}

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params
    const { searchParams } = new URL(request.url)
    const afterIndexRaw = searchParams.get('afterIndex')
    const afterIndex = afterIndexRaw ? Math.max(0, Number(afterIndexRaw)) : 0

    if (Number.isNaN(afterIndex)) {
      return NextResponse.json({ error: 'Invalid afterIndex value' }, { status: 400 })
    }

    const job = await getBuildJobOrThrow(jobId)
    const events = await getBuildEventsSince(jobId, afterIndex)

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        programId: job.programId,
        status: job.status,
        lastEventIndex: job.lastEventIndex,
      },
      events: events.map((event: any) => ({
        index: event.index,
        type: event.type,
        step: event.step,
        status: mapStepStatus(event.status),
        rawStatus: event.status,
        level: event.level,
        message: event.message,
        payload: event.payload,
        timestamp: event.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch build events',
      },
      { status: 500 }
    )
  }
}
