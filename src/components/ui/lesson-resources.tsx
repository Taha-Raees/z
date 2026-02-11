'use client'

import { Library } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { RefreshResourcesButton } from './refresh-resources-button'

interface Resource {
  id: string
  type: string
  title: string
  url: string
  durationSeconds: number | null
  qualityScore: number
  sourceMeta?: {
    channel?: string
    reason?: string
    refreshedAt?: string
  } | null
  retrievedAt: string
}

interface LessonResourcesProps {
  lessonId: string
  initialResources: Resource[]
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function getQualityLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'High', color: 'text-green-600' }
  if (score >= 0.6) return { label: 'Good', color: 'text-blue-600' }
  if (score >= 0.4) return { label: 'Fair', color: 'text-yellow-600' }
  return { label: 'Low', color: 'text-gray-500' }
}

export function LessonResources({ lessonId, initialResources }: LessonResourcesProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources)

  const handleRefresh = (newResources: Resource[]) => {
    setResources(newResources)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Lecture resources
          </CardTitle>
          <RefreshResourcesButton lessonId={lessonId} onRefresh={handleRefresh} />
        </div>
      </CardHeader>
      <CardContent>
        {resources.length > 0 ? (
          <div className="space-y-2">
            {resources.map((resource) => {
              const quality = getQualityLabel(resource.qualityScore)
              const duration = formatDuration(resource.durationSeconds)
              const channel = resource.sourceMeta?.channel
              const refreshedAt = resource.sourceMeta?.refreshedAt
                ? new Date(resource.sourceMeta.refreshedAt).toLocaleDateString()
                : null

              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-border/70 bg-muted/30 px-3 py-2 hover:bg-muted/50"
                >
                  <p className="text-sm font-medium text-foreground">{resource.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase">{resource.type}</span>
                    {channel && (
                      <>
                        <span>•</span>
                        <span>{channel}</span>
                      </>
                    )}
                    {duration && (
                      <>
                        <span>•</span>
                        <span>{duration}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className={quality.color}>{quality.label} quality</span>
                    {refreshedAt && (
                      <>
                        <span>•</span>
                        <span className="text-muted-foreground/70">Refreshed {refreshedAt}</span>
                      </>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <EmptyState title="Resources pending" description="Resources are still being curated for this lesson." />
        )}
      </CardContent>
    </Card>
  )
}
