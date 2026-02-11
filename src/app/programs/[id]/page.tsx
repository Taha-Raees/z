import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, FileWarning, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getLatestBuildJobByProgram } from '@/lib/workflows/program-build-store'
import { AppShell, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

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

  const { program, latestBuildJob } = data
  const moduleCount = program.modules.length
  const lessonCount = program.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const completedLessons = program.modules.reduce(
    (acc, module) => acc + module.lessons.filter((lesson) => lesson.buildStatus === 'COMPLETED').length,
    0
  )

  const livePct = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0
  const status = latestBuildJob?.status === 'FAILED' ? 'error' : latestBuildJob?.isWorking ? 'running' : 'ready'

  return (
    <AppShell nav={productNav} currentPath="/programs" status={status}>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <PageHeader
            title={program.topic}
            subtitle={`${program.currentLevel} → ${program.goal} • Target ${shortDate(program.targetDate)}`}
            actions={
              <>
                <Link
                  href="/programs"
                  className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
                >
                  All programs
                </Link>
                <Link
                  href={`/programs/${program.id}/calendar`}
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendar
                </Link>
              </>
            }
          />

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle>Build progress</CardTitle>
              <Badge variant="muted">{livePct}% lessons ready</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${livePct}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Modules</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{moduleCount}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Lessons ready</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {completedLessons}/{lessonCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {program.modules.map((module) => (
              <Card key={module.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Module {module.index + 1}</p>
                    <CardTitle className="mt-1">{module.title}</CardTitle>
                  </div>
                  <Badge variant={module.buildStatus === 'COMPLETED' ? 'success' : module.buildStatus === 'FAILED' ? 'danger' : module.buildStatus === 'IN_PROGRESS' ? 'warn' : 'muted'}>
                    {module.buildStatus.replace('_', ' ')}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  {module.outcomes.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {module.outcomes.slice(0, 4).map((outcome, index) => (
                        <li key={`${module.id}-outcome-${index}`}>{outcome}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <article key={lesson.id} className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Lesson {lesson.index + 1}: {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">Est. {lesson.estimatedMinutes} min</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                lesson.buildStatus === 'COMPLETED'
                                  ? 'success'
                                  : lesson.buildStatus === 'FAILED'
                                    ? 'danger'
                                    : lesson.buildStatus === 'IN_PROGRESS'
                                      ? 'warn'
                                      : 'muted'
                              }
                            >
                              {lesson.buildStatus.replace('_', ' ')}
                            </Badge>
                            {lesson.buildStatus === 'COMPLETED' ? (
                              <Link href={`/lessons/${lesson.id}`} className="inline-flex items-center text-xs font-semibold text-primary hover:underline">
                                Open
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            ) : null}
                          </div>
                        </div>

                        {lesson.notes?.summary ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{lesson.notes.summary}</p>
                        ) : null}

                        {lesson.resources.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lesson.resources.length} curated resource(s) available
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Background job</CardTitle>
            </CardHeader>
            <CardContent>
              {latestBuildJob ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={latestBuildJob.status === 'COMPLETED' ? 'success' : latestBuildJob.status === 'FAILED' ? 'danger' : latestBuildJob.isWorking ? 'warn' : 'muted'}>
                      {latestBuildJob.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{latestBuildJob.id.slice(-8)}</span>
                  </div>

                  <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>Phase</dt>
                      <dd className="font-medium text-foreground">{latestBuildJob.currentPhase || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Item</dt>
                      <dd className="max-w-[180px] truncate font-medium text-foreground">{latestBuildJob.currentItem || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Modules</dt>
                      <dd className="font-medium text-foreground">
                        {latestBuildJob.completedModules}/{latestBuildJob.totalModules}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Lessons</dt>
                      <dd className="font-medium text-foreground">
                        {latestBuildJob.completedLessons}/{latestBuildJob.totalLessons}
                      </dd>
                    </div>
                  </dl>

                  {latestBuildJob.error ? (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{latestBuildJob.error}</p>
                  ) : null}

                  {latestBuildJob.status === 'FAILED' && latestBuildJob.retryCount < latestBuildJob.maxRetries ? (
                    <form action={`/api/programs/generate/retry/${latestBuildJob.id}`} method="post" className="mt-3">
                      <button className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
                        Retry build ({latestBuildJob.retryCount}/{latestBuildJob.maxRetries})
                      </button>
                    </form>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No build job history available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Student start
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed lessons are available immediately while remaining modules continue in the background.
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                The interface stays quiet. The work happens in the background.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}

export async function generateStaticParams() {
  return []
}
