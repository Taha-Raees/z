import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-gray-500">Review Center</p>
            <h1 className="text-2xl font-bold text-gray-900">Regenerate, Retake, Revisit</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/practice"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Practice Lab
            </Link>
            <Link href="/gradebook" className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white">
              Gradebook
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <article className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">Weak Topic Queue</h2>
            <p className="mt-1 text-xs text-gray-600">
              Lessons with low recent performance. Regenerate similar practice before the next assessment cycle.
            </p>

            {weakLessons.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No weak topics detected from recent attempts.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {weakLessons.map((item) => (
                  <div key={item.lessonId} className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-red-800">
                        {item.programTopic} • {item.lessonTitle}
                      </p>
                      <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-red-700">
                        {item.latestScore === null ? 'Pending' : `${Math.round(item.latestScore)}%`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-red-700">Attempts in weak range: {item.attempts}</p>
                    {item.feedback && <p className="mt-1 text-xs text-red-700">Feedback: {item.feedback}</p>}
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={`/lessons/${item.lessonId}`}
                        className="rounded border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                      >
                        Open Lesson
                      </Link>
                      <Link
                        href="/practice"
                        className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Regenerate Practice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">Spaced Repetition Queue</h2>
            <p className="mt-1 text-xs text-gray-600">
              Auto-prioritized from recent attempts with score-weighted review intervals.
            </p>

            {spacedQueue.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No activity yet to build a repetition queue.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {spacedQueue.map((item) => (
                  <div key={item.id} className={`rounded-lg border p-3 ${bucketStyle[item.bucket]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {item.programTopic} • {item.lessonTitle}
                      </p>
                      <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold">
                        {item.score === null ? 'Pending' : `${Math.round(item.score)}%`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs">
                      Next review: {item.nextReview.toLocaleDateString()} (every {item.revisitDays} day(s))
                    </p>
                    <Link href={`/lessons/${item.lessonId}`} className="mt-2 inline-flex text-xs font-semibold underline">
                      Revisit Lesson
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Weekly Review Objectives</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-600">
              <li>Reattempt at least 3 weak-topic workbooks</li>
              <li>Complete one quiz retake from Assessments</li>
              <li>Review glossary for all lessons below 70%</li>
              <li>Regenerate one mixed-difficulty practice set</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Action Links</h3>
            <div className="mt-2 space-y-2">
              <Link
                href="/practice"
                className="block rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
              >
                Open Practice Lab
              </Link>
              <Link
                href="/programs"
                className="block rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
              >
                Return to Programs
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
              >
                Today&apos;s Schedule
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
