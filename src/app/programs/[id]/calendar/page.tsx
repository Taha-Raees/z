import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-900">Program not found</h1>
          <Link href="/programs" className="mt-4 inline-flex text-primary hover:underline">
            Back to Programs
          </Link>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-gray-500">Program Calendar</p>
            <h1 className="text-2xl font-bold text-gray-900">{program.topic}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/programs/${program.id}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Program Overview
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-5 rounded-xl border bg-white p-4 text-sm text-gray-600">
          Calendar is generated from persisted schedule items. Estimated minutes are shown to enforce daily time budgeting.
        </div>

        {!schedule ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-600">Schedule is still being generated in the background.</p>
          </div>
        ) : days.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-600">No schedule items available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {days.map((day) => {
              const totalMinutes = day.items.reduce((acc, item) => acc + item.estimatedMinutes, 0)
              return (
                <section key={formatDateKey(day.date)} className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">{formatLabel(day.date)}</h2>
                    <span className="text-xs text-gray-600">{totalMinutes} min</span>
                  </div>

                  <div className="space-y-2">
                    {day.items.map((item) => (
                      <div
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
                        {item.refId && (
                          <p className="mt-1 truncate text-[10px] opacity-80">Ref: {item.refId}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

