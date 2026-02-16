'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, QuestionResponseInput } from '@/components/ui'
import { submitExerciseAttempt } from '@/lib/api'

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

function normalizeType(type: string | undefined): string {
  return (type || '').toLowerCase()
}

function createInitialAnswers(questions: QuestionPayload[]): Array<string | number | boolean | null> {
  return questions.map((question) => {
    const type = normalizeType(question.type)
    if (type === 'mcq' || type === 'true_false') return null
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
  const [result, setResult] = useState<{ success: boolean; attemptId: string; grading: { score: number; passed: boolean; feedback: string } } | null>(null)
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
      const payload = await submitExerciseAttempt({
        exerciseSetId,
        answers,
      })
      setResult(payload)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-3 border-border/70 bg-muted/20">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {!isStarted ? (
            <Button
              onClick={() => {
                setIsStarted(true)
                setResult(null)
                setSubmitError(null)
              }}
              size="sm"
            >
              Start set
            </Button>
          ) : (
            <Badge variant="warn">In progress</Badge>
          )}
        </div>

        {!isStarted ? (
          <p className="text-[11px] text-muted-foreground">Open the workbook to answer and submit for grading.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionResponseInput
                key={`${exerciseSetId}-runner-${index}`}
                id={`${exerciseSetId}-q-${index}`}
                index={index}
                type={question.type}
                prompt={question.question || question.prompt || 'Question unavailable'}
                options={question.options}
                value={answers[index]}
                onChange={(value) => setAnswer(index, value)}
                compact
              />
            ))}

            <div className="flex items-center gap-2">
              <Button onClick={submitAttempt} disabled={!canSubmit || isSubmitting} size="sm">
                {isSubmitting ? 'Submitting...' : 'Submit attempt'}
              </Button>
              <Link href={`/lessons/${lessonId}`} className="text-xs font-semibold text-primary hover:underline">
                Back to lesson
              </Link>
            </div>

            {submitError ? (
              <p className="rounded-lg border border-danger/20 bg-danger/10 px-2 py-1 text-xs text-danger">{submitError}</p>
            ) : null}

            {result ? (
              <p className="rounded-lg border border-success/20 bg-success/10 px-2 py-1 text-xs text-success">
                Score: {Math.round(result.grading.score)}% • {result.grading.passed ? 'Passed' : 'Needs review'}
              </p>
            ) : null}

            {result?.grading.feedback ? (
              <p className="rounded-lg border border-info/20 bg-info/10 px-2 py-1 text-xs text-info">{result.grading.feedback}</p>
            ) : null}

            {result ? <p className="text-[10px] text-muted-foreground">Attempt recorded: {result.attemptId}</p> : null}
          </div>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground">Workbook: {title}</p>
      </CardContent>
    </Card>
  )
}
