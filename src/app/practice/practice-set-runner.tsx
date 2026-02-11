'use client'

import { useMemo, useState } from 'react'

type QuestionPayload = {
  type?: string
  question?: string
  prompt?: string
  options?: string[]
}

type ExerciseSetRunnerProps = {
  exerciseSetId: string
  lessonId: string
  title: string
  description: string
  questions: QuestionPayload[]
}

type SubmitResult = {
  success: boolean
  attemptId: string
  grading: {
    score: number
    passed: boolean
    feedback: string
  }
}

function normalizeType(type: string | undefined): string {
  return (type || '').toLowerCase()
}

function createInitialAnswers(questions: QuestionPayload[]): Array<string | number | boolean | null> {
  return questions.map((question) => {
    const type = normalizeType(question.type)
    if (type === 'mcq') return null
    if (type === 'true_false') return null
    return ''
  })
}

export function PracticeSetRunner({
  exerciseSetId,
  lessonId,
  title,
  description,
  questions,
}: ExerciseSetRunnerProps) {
  const [isStarted, setIsStarted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [answers, setAnswers] = useState<Array<string | number | boolean | null>>(() =>
    createInitialAnswers(questions)
  )

  const canSubmit = useMemo(() => {
    if (questions.length === 0) return false

    return answers.every((answer, index) => {
      const type = normalizeType(questions[index]?.type)

      if (type === 'mcq' || type === 'true_false') {
        return answer !== null
      }

      return typeof answer === 'string' ? answer.trim().length > 0 : Boolean(answer)
    })
  }, [answers, questions])

  const setAnswer = (index: number, value: string | number | boolean | null) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const submitAttempt = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseSetId,
          answers,
        }),
      })

      const payload = (await response.json()) as SubmitResult & { error?: string }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to submit exercise set')
      }

      setResult(payload)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-600">{description}</p>
        {!isStarted ? (
          <button
            onClick={() => {
              setIsStarted(true)
              setResult(null)
              setSubmitError(null)
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
          >
            Start Set
          </button>
        ) : (
          <span className="rounded bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
            In Progress
          </span>
        )}
      </div>

      {!isStarted ? (
        <p className="text-[11px] text-gray-500">Open the workbook to answer and submit for grading.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => {
            const type = normalizeType(question.type)
            const prompt = question.question || question.prompt || 'Question unavailable'

            return (
              <div key={`${exerciseSetId}-runner-${index}`} className="rounded-md border bg-white p-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Q{index + 1} • {type || 'item'}
                </p>
                <p className="mt-1 text-xs text-gray-800">{prompt}</p>

                {type === 'mcq' && Array.isArray(question.options) && question.options.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {question.options.map((option, optionIndex) => (
                      <label key={`${exerciseSetId}-q-${index}-opt-${optionIndex}`} className="flex items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name={`${exerciseSetId}-q-${index}`}
                          checked={answers[index] === optionIndex}
                          onChange={() => setAnswer(index, optionIndex)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : type === 'true_false' ? (
                  <div className="mt-2 flex gap-2 text-xs">
                    <button
                      onClick={() => setAnswer(index, true)}
                      className={`rounded border px-2 py-1 ${answers[index] === true ? 'bg-green-100 border-green-300' : 'bg-white border-gray-300'}`}
                    >
                      True
                    </button>
                    <button
                      onClick={() => setAnswer(index, false)}
                      className={`rounded border px-2 py-1 ${answers[index] === false ? 'bg-red-100 border-red-300' : 'bg-white border-gray-300'}`}
                    >
                      False
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={typeof answers[index] === 'string' ? answers[index] : ''}
                    onChange={(event) => setAnswer(index, event.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="Type your answer"
                  />
                )}
              </div>
            )
          })}

          <div className="flex items-center gap-2">
            <button
              onClick={submitAttempt}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Attempt'}
            </button>
            <a href={`/lessons/${lessonId}`} className="text-xs font-semibold text-primary hover:underline">
              Back to Lesson
            </a>
          </div>

          {submitError && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{submitError}</p>}

          {result && (
            <p className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
              Score: {Math.round(result.grading.score)}% • {result.grading.passed ? 'Passed' : 'Needs review'}
            </p>
          )}

          {result?.grading.feedback && (
            <p className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{result.grading.feedback}</p>
          )}

          {result && (
            <p className="text-[10px] text-gray-500">Attempt recorded: {result.attemptId}</p>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] text-gray-500">Workbook: {title}</p>
    </div>
  )
}

