import Link from 'next/link'
import { ClipboardCheck, FileWarning, GraduationCap, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AssessmentRunner } from './assessment-runner'
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
      <AppShell nav={productNav} currentPath="/programs" status="error">
        <EmptyState
          icon={<FileWarning className="h-5 w-5" />}
          title="Assessment not found"
          description="The requested assessment could not be loaded."
          ctaHref="/programs"
          ctaLabel="Back to programs"
        />
      </AppShell>
    )
  }

  const questions = parseJson<AssessmentQuestionPreview[]>(assessment.contentJson) ?? []
  const rubric = parseJson<Record<string, unknown>>(assessment.rubricJson)

  return (
    <AppShell nav={productNav} currentPath="/programs" status="needs-input">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <PageHeader
            title={assessment.title}
            subtitle={`${assessment.program.topic}${assessment.module ? ` • Module ${assessment.module.index + 1}` : ' • Program-wide'}`}
            actions={
              <Link
                href={`/programs/${assessment.programId}`}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Program
              </Link>
            }
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Assessment overview
              </CardTitle>
              <Badge variant="muted">{assessment.type}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This room is loaded from persisted assessment artifacts. Timed and locked modes can be layered without changing API semantics.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{questions.length}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Attempts</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{assessment.attempts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question preview</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <EmptyState title="No question payload" description="Question payload is empty or unavailable." />
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <article key={`${assessment.id}-q-${index}`} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Q{index + 1} • {question.type || 'question'}
                      </p>
                      <p className="mt-1 text-sm text-foreground/90">
                        {question.question || question.prompt || 'Question text unavailable'}
                      </p>

                      {Array.isArray(question.options) && question.options.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                          {question.options.slice(0, 4).map((option, optionIndex) => (
                            <li key={`${assessment.id}-${index}-option-${optionIndex}`}>{option}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <AssessmentRunner assessmentId={assessment.id} questions={questions} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {assessment.attempts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attempts yet.</p>
              ) : (
                <ul className="space-y-2">
                  {assessment.attempts.map((attempt) => (
                    <li key={attempt.id} className="rounded-lg border border-border/70 bg-muted/30 p-2">
                      <p className="text-xs font-semibold text-foreground">
                        {attempt.startedAt.toLocaleDateString()} • {attempt.score === null ? 'Pending' : `${Math.round(attempt.score)}%`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Submitted: {attempt.submittedAt ? attempt.submittedAt.toLocaleString() : 'Not submitted'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Rubric
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rubric ? (
                <pre className="max-h-72 overflow-auto rounded-lg border border-border/70 bg-muted/30 p-2 text-[11px] text-muted-foreground">
                  {JSON.stringify(rubric, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No rubric attached (objective auto-graded assessment).
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                The interface stays quiet. The work happens in the background.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
