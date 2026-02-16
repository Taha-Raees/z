'use client'

import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, QuestionResponseInput } from '@/components/ui'
import { submitAssessmentAttempt } from '@/lib/api'

type AssessmentQuestion = {
  type?: string
  question?: string
  prompt?: string
  options?: string[]
}

type AssessmentRunnerProps = {
  assessmentId: string
  questions: AssessmentQuestion[]
}

function normalizeType(type: string | undefined): string {
  return (type || '').toLowerCase()
}

function createInitialAnswers(questions: AssessmentQuestion[]) {
  return questions.map((question) => {
    const type = normalizeType(question.type)
    if (type === 'mcq' || type === 'true_false') return null
    return ''
  })
}

export function AssessmentRunner({ assessmentId, questions }: AssessmentRunnerProps) {
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
      const payload = await submitAssessmentAttempt({
        assessmentId,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Assessment runner</CardTitle>
        {!isStarted ? (
          <Button
            onClick={() => {
              setIsStarted(true)
              setResult(null)
              setSubmitError(null)
            }}
            size="sm"
          >
            Start attempt
          </Button>
        ) : (
          <Badge variant="warn">In progress</Badge>
        )}
      </CardHeader>

      <CardContent>
        {!isStarted ? (
          <p className="text-xs text-muted-foreground">Start the room to answer all questions and submit for grading.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionResponseInput
                key={`${assessmentId}-runner-${index}`}
                id={`${assessmentId}-q-${index}`}
                index={index}
                type={question.type}
                prompt={question.question || question.prompt || 'Question text unavailable'}
                options={question.options}
                value={answers[index]}
                onChange={(value) => setAnswer(index, value)}
              />
            ))}

            <Button onClick={submitAttempt} disabled={!canSubmit || isSubmitting} size="sm">
              {isSubmitting ? 'Submitting...' : 'Submit assessment'}
            </Button>

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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
