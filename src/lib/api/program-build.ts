import { apiFetch } from '@/lib/api/http'
import type { ProgramBuildStatusResponse } from '@/lib/api/types'

export async function fetchProgramBuildStatus(jobId: string) {
  return apiFetch<ProgramBuildStatusResponse>(`/api/programs/generate/status/${jobId}`)
}

export async function fetchProgramBuildEvents(jobId: string, afterIndex: number = 0) {
  return apiFetch<{
    success: boolean
    events: Array<{
      index: number
      type: string
      step: string
      status: 'pending' | 'in_progress' | 'completed' | 'failed'
      rawStatus: string
      level: string
      message: string | null
      timestamp: string
      payload: unknown
    }>
    error?: string
  }>(`/api/programs/generate/events/${jobId}?afterIndex=${afterIndex}`)
}
