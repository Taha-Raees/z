import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'
import { InstituteShell } from '@/components/institute-shell'

function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return 'Pending'
  return `${Math.round(score)}%`
}

const assessmentTypeColor: Record<string, string> = {
  QUIZ: 'bg-blue-100 text-blue-700',
  TEST: 'bg-indigo-100 text-indigo-700',
  EXAM: 'bg-rose-100 text-rose-700',
}

export default async function GradebookPage() {
  const user = await resolveActiveUser()

  const assessmentAttempts = await prisma.assessmentAttempt.findMany({
    where: { userId: user.id },
    include: {
      assessment: {
        include: {
          program: true,
          module: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  })

  const exerciseAttempts = await prisma.exerciseAttempt.findMany({
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
    take: 24,
  })

  const allScores = [
    ...assessmentAttempts.map((attempt) => attempt.score).filter((score): score is number => score !== null),
    ...exerciseAttempts.map((attempt) => attempt.score).filter((score): score is number => score !== null),
  ]

  const averageScore =
    allScores.length > 0 ? Math.round(allScores.reduce((acc, score) => acc + score, 0) / allScores.length) : null

  return (
    <InstituteShell
      title="Academic Record"
      subtitle="Gradebook and transcript across assessments and workbook attempts."
      nav={[
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/programs', label: 'Programs' },
        { href: '/practice', label: 'Practice Lab' },
        { href: '/gradebook', label: 'Gradebook', active: true },
        { href: '/review', label: 'Review Center' },
      ]}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Gradebook' }]}
      actions={
        <Link
          href="/review"
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Review Center
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Assessment Attempts</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{assessmentAttempts.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Practice Attempts</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{exerciseAttempts.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Score</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{averageScore === null ? 'Pending' : `${averageScore}%`}</p>
          </div>
        </div>

        <section className="mb-6 rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">Assessment Transcript</h2>
          {assessmentAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No assessment attempts yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Program</th>
                    <th className="px-2 py-2">Assessment</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assessmentAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-2 py-2 text-gray-600">{attempt.startedAt.toLocaleDateString()}</td>
                      <td className="px-2 py-2 text-gray-800">{attempt.assessment.program.topic}</td>
                      <td className="px-2 py-2 text-gray-800">{attempt.assessment.title}</td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            assessmentTypeColor[attempt.assessment.type] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {attempt.assessment.type}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-semibold text-gray-900">{formatScore(attempt.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">Practice History</h2>
          {exerciseAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No practice attempts yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {exerciseAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {attempt.exerciseSet.lesson.module.program.topic} • {attempt.exerciseSet.lesson.title}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{formatScore(attempt.score)}</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Attempted {attempt.createdAt.toLocaleDateString()} • Difficulty{' '}
                    {attempt.exerciseSet.difficulty.toLowerCase()} • Type {attempt.exerciseSet.type.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </InstituteShell>
  )
}
