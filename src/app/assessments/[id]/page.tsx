import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AssessmentRunner } from './assessment-runner'

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

type AssessmentQuestionPreview = {
  type?: string
  question?: string
  prompt?: string
  options?: string[]
}

export default async function AssessmentRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      program: true,
      module: true,
      attempts: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-900">Assessment not found</h1>
          <Link href="/programs" className="mt-4 inline-flex text-primary hover:underline">
            Back to Programs
          </Link>
        </div>
      </div>
    )
  }

  const questions = parseJson<AssessmentQuestionPreview[]>(assessment.contentJson) ?? []
  const rubric = parseJson<Record<string, unknown>>(assessment.rubricJson)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-gray-500">Exam Room</p>
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-xs text-gray-600">
              {assessment.program.topic}
              {assessment.module ? ` • Module ${assessment.module.index + 1}` : ' • Program-wide'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/programs/${assessment.programId}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Program
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <article className="rounded-xl border bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Assessment Overview</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {assessment.type}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              This room is preloaded from persisted assessment artifacts. Navigation can be locked and timed mode enforced once submission routes are finalized.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Questions</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{questions.length}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Attempts</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{assessment.attempts.length}</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Question Preview</h2>
            {questions.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">Question payload is empty or unavailable.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {questions.map((question, index) => (
                  <div key={`${assessment.id}-q-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Q{index + 1} • {question.type || 'question'}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-800">
                      {question.question || question.prompt || 'Question text unavailable'}
                    </p>

                    {Array.isArray(question.options) && question.options.length > 0 && (
                      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-700">
                        {question.options.slice(0, 4).map((option, optionIndex) => (
                          <li key={`${assessment.id}-${index}-option-${optionIndex}`}>{option}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <aside className="space-y-4">
          <AssessmentRunner assessmentId={assessment.id} questions={questions} />

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Attempts</h3>
            {assessment.attempts.length === 0 ? (
              <p className="mt-2 text-xs text-gray-600">No attempts yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {assessment.attempts.map((attempt) => (
                  <li key={attempt.id} className="rounded border border-gray-200 bg-gray-50 p-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {attempt.startedAt.toLocaleDateString()} • {attempt.score === null ? 'Pending' : `${Math.round(attempt.score)}%`}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Submitted: {attempt.submittedAt ? attempt.submittedAt.toLocaleString() : 'Not submitted'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Rubric</h3>
            {rubric ? (
              <pre className="mt-2 max-h-72 overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                {JSON.stringify(rubric, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-xs text-gray-600">No rubric attached (objective auto-graded assessment).</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
