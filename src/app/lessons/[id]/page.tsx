import Link from 'next/link'
import { BookOpen, FileWarning, Library, NotebookPen } from 'lucide-react'
import { prisma } from '@/lib/prisma'
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

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          program: true,
        },
      },
      resources: true,
      notes: true,
      exerciseSets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!lesson) {
    return (
      <AppShell nav={productNav} currentPath="/programs" status="error">
        <EmptyState
          icon={<FileWarning className="h-5 w-5" />}
          title="Lesson not found"
          description="The requested lesson could not be loaded."
          ctaHref="/programs"
          ctaLabel="Back to programs"
        />
      </AppShell>
    )
  }

  const objectives = parseJson<string[]>(lesson.objectivesJson) ?? []
  const glossary = parseJson<Array<{ term: string; definition: string }>>(lesson.notes?.glossaryJson) ?? []
  const exerciseContent = lesson.exerciseSets[0]
    ? parseJson<{ questions?: Array<{ type?: string; question?: string; prompt?: string }> }>(
        lesson.exerciseSets[0].contentJson
      )
    : null

  const title = `Lesson ${lesson.index + 1}: ${lesson.title}`
  const breadcrumb = `${lesson.module.program.topic} > Module ${lesson.module.index + 1} > ${title}`

  return (
    <AppShell nav={productNav} currentPath="/programs" status={lesson.buildStatus === 'COMPLETED' ? 'ready' : 'running'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <PageHeader
            title={title}
            subtitle={`${breadcrumb} • Estimated ${lesson.estimatedMinutes} minutes`}
            actions={<Badge variant={lesson.buildStatus === 'COMPLETED' ? 'success' : 'warn'}>{lesson.buildStatus.replace('_', ' ')}</Badge>}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              {objectives.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {objectives.map((objective, index) => (
                    <li key={`${lesson.id}-objective-${index}`}>{objective}</li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Objectives pending" description="Objectives are still being generated." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Lecture resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lesson.resources.length > 0 ? (
                <div className="space-y-2">
                  {lesson.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-border/70 bg-muted/30 px-3 py-2 hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium text-foreground">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {resource.type} • Quality {(resource.qualityScore * 100).toFixed(0)}%
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState title="Resources pending" description="Resources are still being curated for this lesson." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                Guided notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lesson.notes?.contentMarkdown ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{lesson.notes.contentMarkdown}</p>
              ) : (
                <EmptyState title="Notes pending" description="Lesson notes are still being drafted." />
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Workbook preview</CardTitle>
            </CardHeader>
            <CardContent>
              {exerciseContent?.questions?.length ? (
                <ul className="space-y-2">
                  {exerciseContent.questions.slice(0, 4).map((question, index) => (
                    <li key={`${lesson.id}-q-${index}`} className="rounded-lg border border-border/70 bg-muted/30 p-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {question.type || 'question'}
                      </p>
                      <p className="text-xs text-foreground/80">{question.question || question.prompt || '...'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Practice set not ready yet.</p>
              )}
              <Link
                href="/practice"
                className="mt-3 inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
              >
                Open practice lab
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Glossary</CardTitle>
            </CardHeader>
            <CardContent>
              {glossary.length > 0 ? (
                <ul className="space-y-2">
                  {glossary.slice(0, 6).map((item, index) => (
                    <li key={`${lesson.id}-glossary-${index}`}>
                      <p className="text-xs font-semibold text-foreground">{item.term}</p>
                      <p className="text-xs text-muted-foreground">{item.definition}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Glossary entries are pending.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
