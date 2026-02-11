import Link from 'next/link'
import { BookOpenCheck, GraduationCap, Sigma } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { resolveActiveUser } from '@/lib/user'
import {
  AppShell,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from '@/components/ui'
import { productNav } from '@/lib/app-navigation'

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
    <AppShell nav={productNav} currentPath="/gradebook" status="ready">
      <div className="space-y-6">
        <PageHeader
          title="Gradebook"
          subtitle="Transcript across assessments and workbook attempts."
          actions={
            <Link
              href="/review"
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Open review center
            </Link>
          }
        />

        <section className="grid gap-3 md:grid-cols-3">
          <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Assessment attempts" value={assessmentAttempts.length} />
          <StatCard icon={<BookOpenCheck className="h-4 w-4" />} label="Practice attempts" value={exerciseAttempts.length} />
          <StatCard icon={<Sigma className="h-4 w-4" />} label="Average score" value={averageScore === null ? 'Pending' : `${averageScore}%`} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Assessment transcript</CardTitle>
          </CardHeader>
          <CardContent>
          {assessmentAttempts.length === 0 ? (
            <EmptyState
              title="No assessment attempts"
              description="Your submitted quiz, test, and exam attempts will appear here."
            />
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="text-muted-foreground">{attempt.startedAt.toLocaleDateString()}</TableCell>
                      <TableCell>{attempt.assessment.program.topic}</TableCell>
                      <TableCell>{attempt.assessment.title}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${assessmentTypeColor[attempt.assessment.type] || 'bg-gray-100 text-gray-700'}`}>
                          {attempt.assessment.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{formatScore(attempt.score)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice history</CardTitle>
          </CardHeader>
          <CardContent>
          {exerciseAttempts.length === 0 ? (
            <EmptyState title="No practice attempts" description="Practice submissions will appear once you complete workbook sets." />
          ) : (
            <div className="space-y-2">
              {exerciseAttempts.map((attempt) => (
                <article key={attempt.id} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {attempt.exerciseSet.lesson.module.program.topic} • {attempt.exerciseSet.lesson.title}
                    </p>
                    <Badge variant={attempt.score !== null && attempt.score >= 70 ? 'success' : attempt.score === null ? 'muted' : 'warn'}>
                      {formatScore(attempt.score)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Attempted {attempt.createdAt.toLocaleDateString()} • Difficulty{' '}
                    {attempt.exerciseSet.difficulty.toLowerCase()} • Type {attempt.exerciseSet.type.toLowerCase()}
                  </p>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>
      </CardContent>
    </Card>
  )
}
