import { apiFetch } from '@/lib/api/http'
import type { LessonResourcesResponse } from '@/lib/api/types'

export async function refreshLessonResources(lessonId: string) {
  return apiFetch<LessonResourcesResponse>(`/api/lessons/${lessonId}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function fetchLessonResources(lessonId: string) {
  return apiFetch<LessonResourcesResponse>(`/api/lessons/${lessonId}/resources`)
}
