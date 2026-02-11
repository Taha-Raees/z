import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'
import { unstable_noStore as noStore } from 'next/cache'
import { InstituteShell } from '@/components/institute-shell'

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

  return (
    <InstituteShell
      title="Student Dashboard"
      subtitle="Track your learning progress and daily schedule"
      nav={[
        { href: '/dashboard', label: 'Dashboard', active: true },
        { href: '/programs', label: 'Programs' },
        { href: '/practice', label: 'Practice' },
        { href: '/gradebook', label: 'Gradebook' },
        { href: '/review', label: 'Review' },
      ]}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
      actions={
        <Link href="/programs" className="btn-secondary">
          View Programs
        </Link>
      }
    >
      <div className="space-y-8 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon="📚" 
            label="Lessons Completed" 
            value={stats.lessonBlocksCompleted}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard 
            icon="✍️" 
            label="Exercises Done" 
            value={stats.exercisesDone}
            color="from-emerald-500 to-teal-500"
          />
          <StatCard 
            icon="📝" 
            label="Quizzes Passed" 
            value={stats.quizzesPassed}
            color="from-amber-500 to-orange-500"
          />
          <StatCard 
            icon="⏱️" 
            label="Hours Studied" 
            value={stats.hoursStudied}
            color="from-violet-500 to-purple-500"
          />
        </div>

        {/* Today's Schedule */}
        <section className="card-apple p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
              <p className="text-sm text-muted-foreground">
                {dailyPlan ? toDisplayDate(dailyPlan.date) : 'No data available'}
              </p>
            </div>
            {dailyPlan?.programTopic && (
              <span className="badge-apple bg-indigo-100 text-indigo-700">
                {dailyPlan.programTopic}
              </span>
            )}
          </div>

          {!dailyPlan || dailyPlan.items.length === 0 ? (
            <div className="rounded-xl bg-muted/50 border border-border/50 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground">No scheduled items for today.</p>
              <Link href="/programs" className="mt-2 inline-flex text-sm text-primary hover:underline">
                Browse programs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
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

          {dailyPlan?.notes && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50/50 border border-blue-100 p-3">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">{dailyPlan.notes}</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Continue Learning"
            description="Resume your current lessons and complete pending tasks"
            icon="▶️"
            href="/programs"
            gradient="from-indigo-500 to-violet-600"
          />
          <QuickActionCard
            title="Practice Lab"
            description="Work on exercises and get instant feedback"
            icon="💪"
            href="/practice"
            gradient="from-emerald-500 to-teal-600"
          />
          <QuickActionCard
            title="Academic Record"
            description="Review your grades and assessment history"
            icon="📊"
            href="/gradebook"
            gradient="from-amber-500 to-orange-600"
          />
        </div>
      </div>
    </InstituteShell>
  )
}

function StatCard({ 
  icon, 
  label, 
  value,
  color 
}: { 
  icon: string
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="card-apple p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
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
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{typeIcons[type] || '📌'}</span>
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{estimatedMinutes} minutes</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.text} bg-white/80`}>
          {config.label}
        </span>
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  gradient,
}: {
  title: string
  description: string
  icon: string
  href: string
  gradient: string
}) {
  return (
    <Link href={href} className="card-apple p-5 group block">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
