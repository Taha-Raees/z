import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'
import { unstable_noStore as noStore } from 'next/cache'
import {
  AppShell,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  type StatusKind,
} from '@/components/ui'
import { productNav } from '@/lib/app-navigation'
import { BookOpen, CalendarClock, CheckCircle2, ChartColumnBig, PencilLine } from 'lucide-react'

type DailyPlanApiResponse = {
  success: boolean
  programId?: string
  programTopic?: string
  date: string
  totalEstimatedMinutes: number
  items: Array<{
    id: string
    type: string
    estimatedMinutes: number
    status: string
    refId: string | null
  }>
  notes?: string
}

type DashboardStats = {
  lessonBlocksCompleted: number
  exercisesDone: number
  quizzesPassed: number
  hoursStudied: number
}

function toDisplayDate(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toTypeLabel(type: string): string {
  return type.toLowerCase().replace('_', ' ')
}

async function getDailyPlan(): Promise<DailyPlanApiResponse | null> {
  noStore()

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
      return {
        success: true,
        date: new Date().toISOString(),
        totalEstimatedMinutes: 0,
        items: [],
        notes: 'No active program found. Start by creating a new program.',
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const schedule = await prisma.schedule.findFirst({
      where: { programId: activeProgram.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          where: {
            date: {
              gte: startOfToday,
              lt: endOfToday,
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    const items = (schedule?.items ?? [])
      .map((item) => ({
        id: item.id,
        type: item.type,
        estimatedMinutes: item.estimatedMinutes,
        status: item.status,
        refId: item.refId,
      }))
      .sort((a, b) => {
        const pendingRank = (status: string) =>
          status === 'PENDING' ? 0 : status === 'IN_PROGRESS' ? 1 : 2
        return pendingRank(a.status) - pendingRank(b.status)
      })

    const totalEstimatedMinutes = items.reduce((acc, item) => acc + item.estimatedMinutes, 0)

    return {
      success: true,
      programId: activeProgram.id,
      programTopic: activeProgram.topic,
      date: new Date().toISOString(),
      totalEstimatedMinutes,
      items,
      notes:
        items.length === 0
          ? 'No scheduled items for today. Check your program calendar to plan activities.'
          : 'Prioritize unfinished activities first. Complete lessons and exercises to track your progress.',
    }
  } catch {
    return null
  }
}

async function getStats(): Promise<DashboardStats> {
  const user = await resolveActiveUser()

  const [lessonBlocksCompleted, exercisesDone, quizzesPassed, completedScheduleItems] = await Promise.all([
    prisma.scheduleItem.count({
      where: {
        type: 'LESSON',
        status: 'COMPLETED',
        schedule: {
          program: {
            userId: user.id,
          },
        },
      },
    }),
    prisma.exerciseAttempt.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.assessmentAttempt.count({
      where: {
        userId: user.id,
        score: { gte: 70 },
        assessment: { type: 'QUIZ' },
      },
    }),
    prisma.scheduleItem.findMany({
      where: {
        status: 'COMPLETED',
        schedule: {
          program: {
            userId: user.id,
          },
        },
      },
      select: {
        estimatedMinutes: true,
      },
    }),
  ])

  const totalMinutes = completedScheduleItems.reduce((acc, item) => acc + item.estimatedMinutes, 0)

  return {
    lessonBlocksCompleted,
    exercisesDone,
    quizzesPassed,
    hoursStudied: Math.round((totalMinutes / 60) * 10) / 10,
  }
}

export default async function DashboardPage() {
  const [dailyPlan, stats] = await Promise.all([getDailyPlan(), getStats()])

  const shellStatus: StatusKind = dailyPlan?.items.some((item) => item.status === 'IN_PROGRESS')
    ? 'running'
    : dailyPlan?.items.some((item) => item.status === 'PENDING')
      ? 'needs-input'
      : 'ready'

  return (
    <AppShell nav={productNav} currentPath="/dashboard" status={shellStatus}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          subtitle="A calm view of today’s workload, progress, and next actions."
          actions={
            <Link
              href="/programs"
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              View programs
            </Link>
          }
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookOpen className="h-4 w-4" />} label="Lessons completed" value={stats.lessonBlocksCompleted} />
          <StatCard icon={<PencilLine className="h-4 w-4" />} label="Exercises done" value={stats.exercisesDone} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Quizzes passed" value={stats.quizzesPassed} />
          <StatCard icon={<ChartColumnBig className="h-4 w-4" />} label="Hours studied" value={stats.hoursStudied} />
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
            <div>
              <CardTitle>Today’s plan</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {dailyPlan ? toDisplayDate(dailyPlan.date) : 'No data available'}
              </p>
            </div>
            {dailyPlan?.programTopic ? <Badge variant="muted">{dailyPlan.programTopic}</Badge> : null}
          </CardHeader>

          <CardContent className="pt-0">
            {!dailyPlan || dailyPlan.items.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                title="No items scheduled"
                description="No workload is queued for today. Open programs to continue where you left off."
                ctaHref="/programs"
                ctaLabel="Open programs"
              />
            ) : (
              <div className="space-y-2">
                {dailyPlan.items.map((item) => (
                  <ScheduleItem
                    key={item.id}
                    title={`${toTypeLabel(item.type)} activity`}
                    type={item.type}
                    status={item.status}
                    estimatedMinutes={item.estimatedMinutes}
                    refId={item.refId}
                  />
                ))}
              </div>
            )}

            {dailyPlan?.notes ? (
              <p className="mt-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {dailyPlan.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <section className="grid gap-3 md:grid-cols-3">
          <QuickActionCard
            title="Continue learning"
            description="Jump back into modules and open available lessons."
            href="/programs"
          />
          <QuickActionCard
            title="Practice lab"
            description="Run workbook sets and receive instant feedback."
            href="/practice"
          />
          <QuickActionCard
            title="Academic record"
            description="Review attempt history, transcripts, and trends."
            href="/gradebook"
          />
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleItem({
  title,
  type,
  status,
  estimatedMinutes,
  refId,
}: {
  title: string
  type: string
  status: string
  estimatedMinutes: number
  refId: string | null
}) {
  const typeIcons: Record<string, string> = {
    LESSON: '📚',
    EXERCISE: '✍️',
    QUIZ: '📝',
    TEST: '📋',
    EXAM: '🎯',
    REVIEW: '🔄',
    BREAK: '☕',
  }

  const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
    COMPLETED: { 
      bg: 'bg-emerald-50/50', 
      border: 'border-emerald-200', 
      text: 'text-emerald-700',
      label: 'Completed'
    },
    IN_PROGRESS: { 
      bg: 'bg-indigo-50/50', 
      border: 'border-indigo-200', 
      text: 'text-indigo-700',
      label: 'In Progress'
    },
    PENDING: { 
      bg: 'bg-muted/30', 
      border: 'border-border', 
      text: 'text-muted-foreground',
      label: 'Pending'
    },
    SKIPPED: { 
      bg: 'bg-amber-50/50', 
      border: 'border-amber-200', 
      text: 'text-amber-700',
      label: 'Skipped'
    },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <article className={`rounded-xl border ${config.border} ${config.bg} p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">{typeIcons[type] || '📌'}</span>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{estimatedMinutes} minutes</p>
            {refId ? <p className="text-[11px] text-muted-foreground/80">Ref: {refId}</p> : null}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${config.text} bg-background`}>
          {config.label}
        </span>
      </div>
    </article>
  )
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/30">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
