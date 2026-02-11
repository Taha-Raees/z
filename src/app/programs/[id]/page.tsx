import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getLatestBuildJobByProgram } from '@/lib/workflows/program-build-store'

type ProgramApiResponse = {
  success: boolean
  program: {
    id: string
    topic: string
    goal: string
    currentLevel: string
    status: string
    targetDate: string
    modules: Array<{
      id: string
      index: number
      title: string
      buildStatus: string
      buildError: string | null
      outcomes: string[]
      lessons: Array<{
        id: string
        index: number
        title: string
        buildStatus: string
        estimatedMinutes: number
        objectives: string[]
        resources: Array<{
          id: string
          type: string
          title: string
          url: string
          qualityScore: number
        }>
        notes: {
          id: string
          summary: string
        } | null
      }>
    }>
  }
  latestBuildJob: {
    id: string
    status: string
    currentPhase: string | null
    currentItem: string | null
    totalModules: number
    completedModules: number
    totalLessons: number
    completedLessons: number
    retryCount: number
    maxRetries: number
    error: string | null
    isWorking: boolean
  } | null
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

function shortDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function mapProgram(program: any): ProgramApiResponse['program'] {
  return {
    id: program.id,
    topic: program.topic,
    goal: program.goal,
    currentLevel: program.currentLevel,
    status: program.status,
    targetDate: program.targetDate.toISOString(),
    modules: program.modules.map((module: any) => ({
      id: module.id,
      index: module.index,
      title: module.title,
      buildStatus: module.buildStatus,
      buildError: module.buildError,
      outcomes: parseJson<string[]>(module.outcomesJson) ?? [],
      lessons: module.lessons.map((lesson: any) => ({
        id: lesson.id,
        index: lesson.index,
        title: lesson.title,
        buildStatus: lesson.buildStatus,
        estimatedMinutes: lesson.estimatedMinutes,
        objectives: parseJson<string[]>(lesson.objectivesJson) ?? [],
        resources: lesson.resources.map((resource: any) => ({
          id: resource.id,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          qualityScore: resource.qualityScore,
        })),
        notes: lesson.notes
          ? {
              id: lesson.notes.id,
              summary: lesson.notes.contentMarkdown,
            }
          : null,
      })),
    })),
  }
}

async function getProgramData(id: string): Promise<ProgramApiResponse | null> {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { index: 'asc' },
        include: {
          lessons: {
            orderBy: { index: 'asc' },
            include: {
              resources: true,
              notes: true,
            },
          },
        },
      },
    },
  })

  if (!program) return null

  const latestBuildJob = await getLatestBuildJobByProgram(id)

  return {
    success: true,
    program: mapProgram(program),
    latestBuildJob: latestBuildJob
      ? {
          id: latestBuildJob.id,
          status: latestBuildJob.status,
          currentPhase: latestBuildJob.currentPhase,
          currentItem: latestBuildJob.currentItem,
          totalModules: latestBuildJob.totalModules,
          completedModules: latestBuildJob.completedModules,
          totalLessons: latestBuildJob.totalLessons,
          completedLessons: latestBuildJob.completedLessons,
          retryCount: latestBuildJob.retryCount,
          maxRetries: latestBuildJob.maxRetries,
          error: latestBuildJob.error,
          isWorking: latestBuildJob.status === 'QUEUED' || latestBuildJob.status === 'RUNNING',
        }
      : null,
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProgramData(id)

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-900">Program not found</h1>
          <p className="mt-2 text-gray-600">The requested program could not be loaded.</p>
          <Link
            href="/programs"
            className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 font-medium text-white"
          >
            Back to Programs
          </Link>
        </div>
      </div>
    )
  }

  const { program, latestBuildJob } = data
  const moduleCount = program.modules.length
  const lessonCount = program.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const completedLessons = program.modules.reduce(
    (acc, module) => acc + module.lessons.filter((lesson) => lesson.buildStatus === 'COMPLETED').length,
    0
  )

  const livePct = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-gray-500">Program</p>
            <h1 className="text-2xl font-bold text-gray-900">{program.topic}</h1>
            <p className="text-sm text-gray-600">
              {program.currentLevel} → {program.goal} • Target {shortDate(program.targetDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/programs"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              All Programs
            </Link>
            <Link
              href={`/programs/${program.id}/calendar`}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
            >
              Calendar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Build Progress</h2>
              <span className="text-sm font-medium text-gray-600">{livePct}% lessons ready</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${livePct}%` }} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Modules</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{moduleCount}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Lessons Ready</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {completedLessons}/{lessonCount}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {program.modules.map((module) => (
              <article key={module.id} className="rounded-xl border bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Module {module.index + 1}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLE[module.buildStatus] || STATUS_STYLE.PENDING
                    }`}
                  >
                    {module.buildStatus.replace('_', ' ')}
                  </span>
                </div>

                {module.outcomes.length > 0 && (
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {module.outcomes.slice(0, 4).map((outcome, index) => (
                      <li key={`${module.id}-outcome-${index}`}>{outcome}</li>
                    ))}
                  </ul>
                )}

                <div className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Lesson {lesson.index + 1}: {lesson.title}
                          </p>
                          <p className="text-xs text-gray-600">Est. {lesson.estimatedMinutes} min</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_STYLE[lesson.buildStatus] || STATUS_STYLE.PENDING
                            }`}
                          >
                            {lesson.buildStatus.replace('_', ' ')}
                          </span>
                          {lesson.buildStatus === 'COMPLETED' && (
                            <Link
                              href={`/lessons/${lesson.id}`}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Open
                            </Link>
                          )}
                        </div>
                      </div>

                      {lesson.notes?.summary && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-700">{lesson.notes.summary}</p>
                      )}

                      {lesson.resources.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {lesson.resources.length} curated resource(s) available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Background Job</h2>
            {latestBuildJob ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      latestBuildJob.isWorking
                        ? 'animate-pulse bg-blue-500'
                        : latestBuildJob.status === 'COMPLETED'
                          ? 'bg-green-500'
                          : latestBuildJob.status === 'FAILED'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-800">{latestBuildJob.status}</span>
                </div>

                <dl className="mt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between gap-3">
                    <dt>Phase</dt>
                    <dd className="font-medium text-gray-900">{latestBuildJob.currentPhase || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Item</dt>
                    <dd className="max-w-[180px] truncate font-medium text-gray-900">
                      {latestBuildJob.currentItem || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Modules</dt>
                    <dd className="font-medium text-gray-900">
                      {latestBuildJob.completedModules}/{latestBuildJob.totalModules}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Lessons</dt>
                    <dd className="font-medium text-gray-900">
                      {latestBuildJob.completedLessons}/{latestBuildJob.totalLessons}
                    </dd>
                  </div>
                </dl>

                {latestBuildJob.error && (
                  <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                    {latestBuildJob.error}
                  </p>
                )}

                {latestBuildJob.status === 'FAILED' && latestBuildJob.retryCount < latestBuildJob.maxRetries && (
                  <form
                    action={`/api/programs/generate/retry/${latestBuildJob.id}`}
                    method="post"
                    className="mt-3"
                  >
                    <button className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">
                      Retry Build ({latestBuildJob.retryCount}/{latestBuildJob.maxRetries})
                    </button>
                  </form>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs text-gray-600">No build job history available.</p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Student Start</p>
            <p className="mt-1 text-xs text-gray-600">
              Completed lessons are readable immediately. Open any lesson marked COMPLETED and continue while the rest of the program keeps generating in the background.
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}

export async function generateStaticParams() {
  return []
}
