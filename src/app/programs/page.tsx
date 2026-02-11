import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getLatestBuildJobByProgram } from '@/lib/workflows/program-build-store'
import { resolveActiveUser } from '@/lib/user'
import { InstituteShell } from '@/components/institute-shell'

type ProgramWithBuild = {
  id: string
  topic: string
  goal: string
  currentLevel: string
  status: string
  targetDate: Date
  createdAt: Date
  moduleCount: number
  lessonCount: number
  completedLessonCount: number
  latestBuildJob: {
    id: string
    status: string
    completedLessons: number
    totalLessons: number
    completedModules: number
    totalModules: number
    retryCount: number
    maxRetries: number
    error: string | null
    isWorking: boolean
  } | null
}

function progressPercent(program: ProgramWithBuild): number {
  if (program.lessonCount > 0) {
    return Math.round((program.completedLessonCount / program.lessonCount) * 100)
  }
  if (program.latestBuildJob?.totalLessons && program.latestBuildJob.totalLessons > 0) {
    return Math.round((program.latestBuildJob.completedLessons / program.latestBuildJob.totalLessons) * 100)
  }
  return program.status === 'ACTIVE' ? 100 : 0
}

function statusBadge(status: string) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
    COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
    PAUSED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Paused' },
    DRAFT: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Draft' },
    ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Archived' },
  }
  return configs[status] || configs.DRAFT
}

async function getPrograms(): Promise<ProgramWithBuild[]> {
  const user = await resolveActiveUser()

  const programs = await prisma.program.findMany({
    where: { userId: user.id },
    include: {
      modules: {
        include: {
          lessons: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const withBuild = await Promise.all(
    programs.map(async (program) => {
      const latestBuildJob = await getLatestBuildJobByProgram(program.id)

      const lessonCount = program.modules.reduce((acc, module) => acc + module.lessons.length, 0)
      const completedLessonCount = latestBuildJob?.completedLessons ?? (program.status === 'ACTIVE' ? lessonCount : 0)

      return {
        id: program.id,
        topic: program.topic,
        goal: program.goal,
        currentLevel: program.currentLevel,
        status: program.status,
        targetDate: program.targetDate,
        createdAt: program.createdAt,
        moduleCount: program.modules.length,
        lessonCount,
        completedLessonCount,
        latestBuildJob: latestBuildJob
          ? {
              id: latestBuildJob.id,
              status: latestBuildJob.status,
              completedLessons: latestBuildJob.completedLessons,
              totalLessons: latestBuildJob.totalLessons,
              completedModules: latestBuildJob.completedModules,
              totalModules: latestBuildJob.totalModules,
              retryCount: latestBuildJob.retryCount,
              maxRetries: latestBuildJob.maxRetries,
              error: latestBuildJob.error,
              isWorking: latestBuildJob.status === 'QUEUED' || latestBuildJob.status === 'RUNNING',
            }
          : null,
      }
    })
  )

  return withBuild
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <InstituteShell
      title="My Programs"
      subtitle="View and manage your learning programs"
      nav={[
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/programs', label: 'Programs', active: true },
        { href: '/practice', label: 'Practice' },
        { href: '/gradebook', label: 'Gradebook' },
        { href: '/review', label: 'Review' },
      ]}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Programs' }]}
      actions={
        <Link href="/admissions" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Program
        </Link>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info Card */}
        <div className="card-apple p-4 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">Program Management</p>
              <p className="text-sm text-muted-foreground mt-1">
                Programs continue generating content in the background. Completed lessons are available immediately.
              </p>
            </div>
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="card-apple p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No programs yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your learning journey by creating your first personalized program through our admissions process.
            </p>
            <Link href="/admissions" className="btn-primary inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Program
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const pct = progressPercent(program)
              const build = program.latestBuildJob
              const statusConfig = statusBadge(program.status)

              return (
                <article key={program.id} className="card-apple overflow-hidden">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-foreground truncate">{program.topic}</h2>
                        <p className="text-sm text-muted-foreground">
                          {program.currentLevel} → {program.goal}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} flex-shrink-0`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{pct}%</span>
                      </div>
                      <div className="progress-apple">
                        <div style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="font-medium text-sm text-foreground">{program.targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="font-medium text-sm text-foreground">{program.moduleCount}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">Lessons</p>
                        <p className="font-medium text-sm text-foreground">{program.completedLessonCount}/{program.lessonCount}</p>
                      </div>
                    </div>

                    {/* Build Status */}
                    {build && (
                      <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Generation</span>
                          <span className={`inline-flex items-center gap-1.5 text-xs ${build.isWorking ? 'text-indigo-600' : build.status === 'COMPLETED' ? 'text-emerald-600' : build.status === 'FAILED' ? 'text-red-600' : 'text-muted-foreground'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${build.isWorking ? 'bg-indigo-500 animate-pulse' : build.status === 'COMPLETED' ? 'bg-emerald-500' : build.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'}`} />
                            {build.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Lessons {build.completedLessons}/{build.totalLessons} • Modules {build.completedModules}/{build.totalModules}
                        </p>
                        {build.error && (
                          <p className="mt-1 text-xs text-red-600">{build.error}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link
                        href={`/programs/${program.id}`}
                        className="flex-1 btn-primary text-center text-sm"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/programs/${program.id}/calendar`}
                        className="btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </InstituteShell>
  )
}
