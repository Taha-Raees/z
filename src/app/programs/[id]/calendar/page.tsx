import Link from 'next/link'
import { CalendarClock, FileWarning } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AppShell, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const itemTypeStyle: Record<string, string> = {
  LESSON: 'bg-blue-50 border-blue-200 text-blue-700',
  EXERCISE: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  QUIZ: 'bg-amber-50 border-amber-200 text-amber-700',
  TEST: 'bg-orange-50 border-orange-200 text-orange-700',
  EXAM: 'bg-red-50 border-red-200 text-red-700',
  REVIEW: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  BREAK: 'bg-gray-50 border-gray-200 text-gray-700',
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-yellow-100 text-yellow-700',
}

export default async function ProgramCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      schedules: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          items: {
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })

  if (!program) {
    return (
      <AppShell nav={productNav} currentPath="/programs" status="error">
        <EmptyState
          icon={<FileWarning className="h-5 w-5" />}
          title="Program not found"
          description="The requested program could not be loaded."
          ctaHref="/programs"
          ctaLabel="Back to programs"
        />
      </AppShell>
    )
  }

  const schedule = program.schedules[0]
  const grouped = new Map<string, { date: Date; items: typeof schedule.items }>()

  if (schedule) {
    for (const item of schedule.items) {
      const key = formatDateKey(item.date)
      if (!grouped.has(key)) {
        grouped.set(key, { date: item.date, items: [] })
      }
      grouped.get(key)!.items.push(item)
    }
  }

  const days = Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <AppShell nav={productNav} currentPath="/programs" status={schedule ? 'ready' : 'running'}>
      <div className="space-y-6">
        <PageHeader
          title={`${program.topic} Calendar`}
          subtitle="Time budget view generated from persisted schedule items."
          actions={
            <>
              <Link
                href={`/programs/${program.id}`}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Program overview
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Dashboard
              </Link>
            </>
          }
        />

        <Card className="subtle-gradient">
          <CardContent className="flex items-start gap-3 p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              Estimated minutes are grouped by day to keep pacing clear and sustainable.
            </p>
          </CardContent>
        </Card>

        {!schedule ? (
          <EmptyState
            title="Schedule is still generating"
            description="Background agents are preparing the calendar. Check again shortly."
          />
        ) : days.length === 0 ? (
          <EmptyState title="No schedule items yet" description="Calendar items appear once scheduling artifacts are ready." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {days.map((day) => {
              const totalMinutes = day.items.reduce((acc, item) => acc + item.estimatedMinutes, 0)
              return (
                <Card key={formatDateKey(day.date)}>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">{formatLabel(day.date)}</CardTitle>
                    <Badge variant="muted">{totalMinutes} min</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {day.items.map((item) => (
                      <article
                        key={item.id}
                        className={`rounded-lg border px-3 py-2 ${itemTypeStyle[item.type] || itemTypeStyle.BREAK}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide">{item.type}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge[item.status]}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs">Estimated {item.estimatedMinutes} min</p>
                        {item.refId ? <p className="mt-1 truncate text-[10px] opacity-80">Ref: {item.refId}</p> : null}
                      </article>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
