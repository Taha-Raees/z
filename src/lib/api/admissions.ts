import { apiFetch } from '@/lib/api/http'
import type {
  AdmissionsAnswerResponse,
  AdmissionsStartResponse,
  OnboardingProfile,
  ProgramBuildQueueResponse,
} from '@/lib/api/types'

export async function startAdmissionsSession() {
  return apiFetch<AdmissionsStartResponse>('/api/admissions/start', {
    method: 'POST',
  })
}

export async function submitAdmissionsAnswer(input: {
  sessionId: string | null
  questionKey: string
  answer: unknown
}) {
  return apiFetch<AdmissionsAnswerResponse>('/api/admissions/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function queueProgramBuild(profile: OnboardingProfile) {
  return apiFetch<ProgramBuildQueueResponse>('/api/programs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  })
}

export async function retryProgramBuild(jobId: string) {
  return apiFetch<{ success: boolean; retryCount: number; maxRetries: number; resumeFrom?: string; error?: string }>(
    `/api/programs/generate/retry/${jobId}`,
    {
      method: 'POST',
    }
  )
}

export async function recoverProgramBuild(jobId: string) {
  return apiFetch<{ success: boolean; resumeFrom?: string; error?: string }>(
    `/api/programs/generate/recover/${jobId}`,
    {
      method: 'POST',
    }
  )
}
