import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarClock, ClipboardCheck, LayoutDashboard, LibraryBig, PenLine, Sparkles, TrendingUp } from 'lucide-react'

const featureCards = [
  {
    icon: BookOpen,
    title: 'Guided Admissions',
    text: 'Interview-based intake captures goals, level, language policy, and pace before generation starts.',
  },
  {
    icon: LibraryBig,
    title: 'Structured Curriculum',
    text: 'Programs are assembled into modules and lessons with progressive build visibility.',
  },
  {
    icon: PenLine,
    title: 'Practice Workbooks',
    text: 'Exercise sets and immediate grading keep practice loops short and measurable.',
  },
  {
    icon: ClipboardCheck,
    title: 'Assessment Rooms',
    text: 'Quiz, test, and exam rooms use persisted artifacts and scoring traces.',
  },
  {
    icon: CalendarClock,
    title: 'Calendar and Daily Plan',
    text: 'Time-budgeted schedules prioritize unfinished activities and recovery work.',
  },
  {
    icon: TrendingUp,
    title: 'Progress and Review',
    text: 'Gradebook and weak-topic queues highlight where to reinforce next.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-b border-border/70">
        <div className="section-apple flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold text-foreground">
            AI School
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-secondary hidden sm:inline-flex">
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/admissions" className="btn-primary">
              Admissions
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="section-apple py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-primary">
                Modern Institute Workflow
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Admissions to Outcomes in a Single Academic Workspace
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Build personalized programs, run lessons and practice, complete assessments, and track progress without switching tools.
                Background agents keep generation and updates moving while the interface stays focused.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admissions" className="btn-primary h-11 px-5">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Admissions
                </Link>
                <Link href="/programs" className="btn-secondary h-11 px-5">
                  Explore Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="md:col-span-4">
              <div className="surface-elevated p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">Institution Flow</h2>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>1. Admissions interview</li>
                  <li>2. Program generation pipeline</li>
                  <li>3. Lessons and workbook practice</li>
                  <li>4. Assessments and grading</li>
                  <li>5. Review and transcript updates</li>
                </ol>
              </div>
            </aside>
          </div>
        </section>

        <section className="section-apple pb-16">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="surface p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="section-apple pb-20">
          <div className="surface-elevated subtle-gradient p-8 text-center md:p-10">
            <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Start with admissions, then build with confidence</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              The system preserves route stability and backend contracts while providing a full modernized learning interface across desktop and mobile.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/admissions" className="btn-primary">
                Begin Admissions
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Open Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
