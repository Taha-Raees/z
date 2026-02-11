import Link from 'next/link'
import { ArrowRight, CalendarClock, Repeat2, Siren } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'
import { AppShell, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function scoreToBucket(score: number | null): 'weak' | 'medium' | 'strong' {
  if (score === null) return 'medium'
  if (score < 60) return 'weak'
  if (score < 80) return 'medium'
  return 'strong'
}

const bucketStyle = {
  weak: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  strong: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

export default async function ReviewCenterPage() {
  const user = await resolveActiveUser()

  const recentExerciseAttempts = await prisma.exerciseAttempt.findMany({
    where: { userId: user.id },
    include: {
      exerciseSet: {
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  program: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 36,
  })

  const weakAttempts = recentExerciseAttempts.filter((attempt) => (attempt.score ?? 70) < 60)

  const weakByLesson = new Map<
    string,
    {
      lessonId: string
      lessonTitle: string
      programTopic: string
      latestScore: number | null
      attempts: number
      feedback: string | null
    }
  >()

  for (const attempt of weakAttempts) {
    const lessonId = attempt.exerciseSet.lessonId
    const existing = weakByLesson.get(lessonId)
    const feedbackJson = parseJson<{ feedback?: string }>(attempt.feedbackJson)

    if (!existing) {
      weakByLesson.set(lessonId, {
        lessonId,
        lessonTitle: attempt.exerciseSet.lesson.title,
        programTopic: attempt.exerciseSet.lesson.module.program.topic,
        latestScore: attempt.score,
        attempts: 1,
        feedback: feedbackJson?.feedback ?? null,
      })
      continue
    }

    existing.attempts += 1
    if (existing.latestScore === null || (attempt.score ?? 0) < existing.latestScore) {
      existing.latestScore = attempt.score
      existing.feedback = feedbackJson?.feedback ?? existing.feedback
    }
  }

  const spacedQueue = recentExerciseAttempts.slice(0, 12).map((attempt, index) => {
    const bucket = scoreToBucket(attempt.score)
    const revisitDays = bucket === 'weak' ? 1 : bucket === 'medium' ? 3 : 7
    const nextReview = new Date(attempt.createdAt)
    nextReview.setDate(nextReview.getDate() + revisitDays)

    return {
      id: `${attempt.id}-${index}`,
      lessonId: attempt.exerciseSet.lessonId,
      lessonTitle: attempt.exerciseSet.lesson.title,
      programTopic: attempt.exerciseSet.lesson.module.program.topic,
      score: attempt.score,
      bucket,
      nextReview,
      revisitDays,
    }
  })

  const weakLessons = Array.from(weakByLesson.values()).slice(0, 15)

  return (
    <AppShell nav={productNav} currentPath="/review" status="needs-input">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <PageHeader
            title="Review"
            subtitle="Regenerate weak areas, retake at the right interval, and keep momentum calm."
            actions={
              <Link
                href="/practice"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Open practice
              </Link>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-600" />
                Weak topic queue
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Lessons with low recent performance. Regenerate similar practice before your next assessment cycle.
              </p>
            </CardHeader>
            <CardContent>
              {weakLessons.length === 0 ? (
                <EmptyState
                  title="No weak topics detected"
                  description="Recent attempts are stable. Keep reviewing with spaced repetition."
                />
              ) : (
                <div className="space-y-2">
                  {weakLessons.map((item) => (
                    <article key={item.lessonId} className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-red-900">
                          {item.programTopic} • {item.lessonTitle}
                        </p>
                        <Badge variant="danger">
                          {item.latestScore === null ? 'Pending' : `${Math.round(item.latestScore)}%`}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-red-700">Attempts in weak range: {item.attempts}</p>
                      {item.feedback ? <p className="mt-1 text-xs text-red-700">Feedback: {item.feedback}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href={`/lessons/${item.lessonId}`}
                          className="inline-flex h-8 items-center rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-700"
                        >
                          Open lesson
                        </Link>
                        <Link
                          href="/practice"
                          className="inline-flex h-8 items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white"
                        >
                          Regenerate practice
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat2 className="h-4 w-4 text-emerald-600" />
                Spaced repetition queue
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Prioritized from recent attempts with score-weighted review intervals.
              </p>
            </CardHeader>
            <CardContent>
              {spacedQueue.length === 0 ? (
                <EmptyState
                  title="Queue is empty"
                  description="Complete more workbook sets to build an adaptive repetition queue."
                />
              ) : (
                <div className="space-y-2">
                  {spacedQueue.map((item) => (
                    <article key={item.id} className={`rounded-xl border p-3 ${bucketStyle[item.bucket]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {item.programTopic} • {item.lessonTitle}
                        </p>
                        <Badge variant={item.bucket === 'strong' ? 'success' : item.bucket === 'medium' ? 'warn' : 'danger'}>
                          {item.score === null ? 'Pending' : `${Math.round(item.score)}%`}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs">
                        Next review: {item.nextReview.toLocaleDateString()} (every {item.revisitDays} day(s))
                      </p>
                      <Link href={`/lessons/${item.lessonId}`} className="mt-2 inline-flex items-center text-xs font-semibold underline">
                        Revisit lesson
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weekly review objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                <li>Reattempt at least 3 weak-topic workbooks</li>
                <li>Complete one quiz retake from Assessments</li>
                <li>Review glossary for all lessons below 70%</li>
                <li>Regenerate one mixed-difficulty practice set</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Action links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/practice"
                className="inline-flex h-9 w-full items-center justify-between rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
              >
                Open practice
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex h-9 w-full items-center justify-between rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
              >
                Return to programs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-9 w-full items-center justify-between rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
              >
                Today&apos;s schedule
                <CalendarClock className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
