import Link from 'next/link'
import { ArrowRight, CalendarDays, FolderOpen, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getLatestBuildJobByProgram } from '@/lib/workflows/program-build-store'
import { resolveActiveUser } from '@/lib/user'
import {
  AppShell,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  type StatusKind,
} from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

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
  const configs: Record<string, { variant: 'muted' | 'success' | 'warn' | 'danger'; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    PAUSED: { variant: 'warn', label: 'Paused' },
    DRAFT: { variant: 'muted', label: 'Draft' },
    ARCHIVED: { variant: 'muted', label: 'Archived' },
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
  const shellStatus: StatusKind = programs.some((program) => program.latestBuildJob?.isWorking)
    ? 'running'
    : 'ready'

  return (
    <AppShell nav={productNav} currentPath="/programs" status={shellStatus}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Programs"
          subtitle="Your goals are translated into structured programs by background agents."
          actions={
            <Link
              href="/admissions"
              className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start new program
            </Link>
          }
        />

        <Card className="subtle-gradient">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              Program generation is resumable and progressive. New lessons appear as soon as each module is complete.
            </p>
          </CardContent>
        </Card>

        {programs.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-5 w-5" />}
            title="No programs yet"
            description="Run admissions once to generate your first personalized program."
            ctaHref="/admissions"
            ctaLabel="Start admissions"
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.map((program) => {
              const pct = progressPercent(program)
              const build = program.latestBuildJob
              const statusConfig = statusBadge(program.status)

              return (
                <Card key={program.id} className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{program.topic}</CardTitle>
                        <CardDescription>
                          {program.currentLevel} → {program.goal}
                        </CardDescription>
                      </div>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                        <p className="text-[11px] text-muted-foreground">Target</p>
                        <p className="text-xs font-medium text-foreground">
                          {program.targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                        <p className="text-[11px] text-muted-foreground">Modules</p>
                        <p className="text-xs font-medium text-foreground">{program.moduleCount}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                        <p className="text-[11px] text-muted-foreground">Lessons</p>
                        <p className="text-xs font-medium text-foreground">
                          {program.completedLessonCount}/{program.lessonCount}
                        </p>
                      </div>
                    </div>

                    {build ? (
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Generation</span>
                          <span className="font-medium text-foreground">
                            {build.status} {build.isWorking ? '• running' : ''}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Lessons {build.completedLessons}/{build.totalLessons} • Modules {build.completedModules}/
                          {build.totalModules}
                        </p>
                        {build.error ? <p className="mt-1 text-xs text-red-600">{build.error}</p> : null}
                      </div>
                    ) : null}
                  </CardContent>

                  <CardFooter className="mt-auto justify-between pt-1">
                    <Link
                      href={`/programs/${program.id}`}
                      className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                    >
                      Open
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/programs/${program.id}/calendar`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                      aria-label="Open calendar"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </section>
        )}
      </div>
    </AppShell>
  )
}
