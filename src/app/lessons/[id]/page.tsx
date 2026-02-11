import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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
      <div className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-4xl rounded-xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-900">Lesson not found</h1>
          <Link href="/programs" className="mt-4 inline-flex text-primary hover:underline">
            Back to Programs
          </Link>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <p className="text-xs text-gray-500">{breadcrumb}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Estimated {lesson.estimatedMinutes} minutes</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Objectives</h2>
            {objectives.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {objectives.map((objective, index) => (
                  <li key={`${lesson.id}-objective-${index}`}>{objective}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Objectives are still being generated.</p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Lecture Hall Resources</h2>
            {lesson.resources.length > 0 ? (
              <div className="mt-3 space-y-2">
                {lesson.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                    <p className="text-xs text-gray-600">
                      {resource.type} • Quality {(resource.qualityScore * 100).toFixed(0)}%
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Resources are still being curated for this lesson.</p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Guided Notes</h2>
            {lesson.notes?.contentMarkdown ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {lesson.notes.contentMarkdown}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Lesson notes are still being drafted.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Workbook Preview</h3>
            {exerciseContent?.questions?.length ? (
              <ul className="mt-3 space-y-2">
                {exerciseContent.questions.slice(0, 4).map((question, index) => (
                  <li key={`${lesson.id}-q-${index}`} className="rounded-md border border-gray-200 p-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {question.type || 'question'}
                    </p>
                    <p className="text-xs text-gray-700">{question.question || question.prompt || '...'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-600">Practice set not ready yet.</p>
            )}
            <Link
              href="/practice"
              className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
            >
              Open Practice Lab
            </Link>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Glossary</h3>
            {glossary.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {glossary.slice(0, 6).map((item, index) => (
                  <li key={`${lesson.id}-glossary-${index}`}>
                    <p className="text-xs font-semibold text-gray-800">{item.term}</p>
                    <p className="text-xs text-gray-600">{item.definition}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-600">Glossary entries are pending.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

