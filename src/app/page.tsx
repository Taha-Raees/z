import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="glass border-b border-white/50 sticky top-0 z-50">
        <div className="section-apple flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-foreground">Virtual School</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/programs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Programs
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-apple py-20 lg:py-28">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            AI-Powered Learning Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              AI School
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience education reimagined. Our AI agents create personalized curricula, 
            find the best learning resources, and guide you through interactive lessons 
            and assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admissions" className="btn-primary inline-flex items-center justify-center gap-2 text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Learning
            </Link>
            <Link href="/programs" className="btn-secondary inline-flex items-center justify-center gap-2 text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Browse Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-apple py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Everything You Need to Learn
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From personalized curriculum generation to AI tutoring, we provide a complete learning ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🎓"
            title="Smart Admissions"
            description="Answer a few questions and our AI will design a curriculum tailored to your goals and current level."
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon="📚"
            title="Dynamic Curriculum"
            description="AI-generated courses with modules, lessons, and learning outcomes customized for you."
            gradient="from-violet-500 to-purple-500"
          />
          <FeatureCard
            icon="🔍"
            title="Resource Curation"
            description="Automatically discover and validate the best YouTube videos, articles, and learning materials."
            gradient="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon="✍️"
            title="Interactive Exercises"
            description="Multiple formats including MCQ, matching, cloze, short answer, speaking, and writing."
            gradient="from-amber-500 to-orange-500"
          />
          <FeatureCard
            icon="📝"
            title="AI Assessments"
            description="Take quizzes, tests, and exams with intelligent grading and detailed feedback."
            gradient="from-rose-500 to-pink-500"
          />
          <FeatureCard
            icon="📊"
            title="Progress Tracking"
            description="Monitor your journey with detailed analytics, gradebook, and transcripts."
            gradient="from-indigo-500 to-blue-500"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="section-apple py-16">
        <div className="card-apple p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Four simple steps to begin your personalized learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard
              step="1"
              title="Admissions"
              description="Share your learning goals, current level, and preferences through a guided interview."
            />
            <StepCard
              step="2"
              title="AI Generation"
              description="Our AI agents create a personalized curriculum with lessons and resources."
            />
            <StepCard
              step="3"
              title="Learn & Practice"
              description="Follow your schedule, complete lessons, and practice with exercises."
            />
            <StepCard
              step="4"
              title="Assess & Improve"
              description="Take assessments, receive AI feedback, and track your progress."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-apple py-16">
        <div className="card-apple p-8 lg:p-12 text-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of learners who are achieving their goals with personalized AI education.
          </p>
          <Link href="/admissions" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="section-apple py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">Virtual School</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Education System. Powered by AI agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: string
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="card-apple p-6 group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="text-center group">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
