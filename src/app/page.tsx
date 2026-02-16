import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  PenLine,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

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

const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
    alt: 'Students studying together in a modern learning space',
  },
  {
    src: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Learner reviewing material on a laptop',
  },
  {
    src: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    alt: 'Study notes and planning materials on a desk',
  },
]

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80',
    alt: 'Academic books and learning resources',
    label: 'Resource Curation',
  },
  {
    src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80',
    alt: 'Bookshelf with technical learning books',
    label: 'Deep Study',
  },
  {
    src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=80',
    alt: 'Lecture hall with learners',
    label: 'Assessment Ready',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip">
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
        <section className="section-apple py-10 md:py-14">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-primary">
                Modern Institute Workflow
              </p>

              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Admissions to Outcomes in One Academic Workspace
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Build personalized programs, run lessons and practice, complete assessments, and track progress without switching tools.
                Background agents keep generation and updates moving while the interface stays focused.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/admissions" className="btn-primary h-11 px-5">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Admissions
                </Link>
                <Link href="/programs" className="btn-secondary h-11 px-5">
                  Explore Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Onboarding</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">Adaptive</p>
                </div>
                <div className="surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Pipelines</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">Resumable</p>
                </div>
                <div className="surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Progress</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">Measurable</p>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="relative col-span-2 h-52 overflow-hidden rounded-2xl border border-border/80 shadow-sm md:h-64">
                  <Image
                    src={heroImages[0].src}
                    alt={heroImages[0].alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/15 to-transparent" />
                  <p className="absolute bottom-4 left-4 max-w-xs font-display text-xl font-semibold text-white md:text-2xl">
                    Cohort-style learning, personalized by AI
                  </p>
                </article>

                {heroImages.slice(1).map((image, index) => (
                  <article key={image.src} className="relative h-40 overflow-hidden rounded-2xl border border-border/80 shadow-sm md:h-48">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 24vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
                    <p className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-[0.1em] text-white/95">
                      {index === 0 ? 'Practice Ready' : 'Assessment Focus'}
                    </p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="section-apple pb-6 md:pb-10">
          <div className="surface-elevated subtle-gradient p-5 md:p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">Institution Flow</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A single operational surface from intake to scoring and weak-topic review.
            </p>
            <ol className="mt-4 grid gap-2 text-sm text-foreground sm:grid-cols-2 lg:grid-cols-5">
              <li className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">1. Admissions interview</li>
              <li className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">2. Program generation</li>
              <li className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">3. Lessons and workbooks</li>
              <li className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">4. Assessments and grading</li>
              <li className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">5. Review and transcript</li>
            </ol>
          </div>
        </section>

        <section className="section-apple py-8 md:py-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="surface group p-5 transition-transform duration-200 hover:-translate-y-0.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="section-apple py-4 md:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {galleryImages.map((item) => (
              <article key={item.src} className="relative h-48 overflow-hidden rounded-2xl border border-border/80 md:h-56">
                <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-black/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                  {item.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-apple pb-20 pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/80">
            <Image
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=80"
              alt="Students in a lecture hall"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/78 via-foreground/62 to-foreground/45" />

            <div className="relative p-8 md:p-10">
              <h2 className="max-w-2xl font-display text-2xl font-semibold text-white md:text-3xl">
                Start with admissions, then build with confidence
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">
                Keep existing backend contracts and route URLs while running a full modernized learner interface across desktop and mobile.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/admissions" className="btn-primary">
                  Begin Admissions
                </Link>
                <Link href="/dashboard" className="inline-flex h-10 items-center rounded-xl border border-white/35 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/18">
                  Open Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
