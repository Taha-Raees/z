import { apiFetch } from '@/lib/api/http'
import type { AttemptSubmissionResponse } from '@/lib/api/types'

export async function submitExerciseAttempt(input: {
  exerciseSetId: string
  answers: Array<string | number | boolean | null>
}) {
  return apiFetch<AttemptSubmissionResponse>(`/api/exercises/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function submitAssessmentAttempt(input: {
  assessmentId: string
  answers: Array<string | number | boolean | null>
}) {
  return apiFetch<AttemptSubmissionResponse>(`/api/assessments/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
