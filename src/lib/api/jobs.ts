import { apiFetch } from '@/lib/api/http'
import type { JobDetailsResponse, JobsListResponse } from '@/lib/api/types'

export async function fetchJobs(filters?: {
  userId?: string
  programId?: string
  lessonId?: string
  status?: string
  type?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId) params.set('userId', filters.userId)
  if (filters?.programId) params.set('programId', filters.programId)
  if (filters?.lessonId) params.set('lessonId', filters.lessonId)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters?.offset !== undefined) params.set('offset', String(filters.offset))

  return apiFetch<JobsListResponse>(`/api/jobs?${params.toString()}`)
}

export async function fetchJobDetails(id: string) {
  return apiFetch<JobDetailsResponse>(`/api/jobs/${id}`)
}
