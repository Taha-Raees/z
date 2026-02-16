'use client'

import { Library, Clock3, SignalHigh, Radio } from 'lucide-react'
import { useState } from 'react'
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import type { LessonResource } from '@/lib/api'
import { RefreshResourcesButton } from './refresh-resources-button'

interface LessonResourcesProps {
  lessonId: string
  initialResources: LessonResource[]
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'Duration pending'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function getQualityMeta(score: number): { label: string; variant: 'success' | 'info' | 'warn' | 'muted' } {
  if (score >= 0.8) return { label: 'High quality', variant: 'success' }
  if (score >= 0.6) return { label: 'Good quality', variant: 'info' }
  if (score >= 0.4) return { label: 'Fair quality', variant: 'warn' }
  return { label: 'Low quality', variant: 'muted' }
}

export function LessonResources({ lessonId, initialResources }: LessonResourcesProps) {
  const [resources, setResources] = useState<LessonResource[]>(initialResources)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Library className="h-4 w-4" />
          Lecture Resources
        </CardTitle>
        <RefreshResourcesButton lessonId={lessonId} onRefresh={setResources} />
      </CardHeader>

      <CardContent>
        {resources.length > 0 ? (
          <div className="space-y-2">
            {resources.map((resource) => {
              const quality = getQualityMeta(resource.qualityScore)
              const refreshedAt = resource.sourceMeta?.refreshedAt
                ? new Date(resource.sourceMeta.refreshedAt).toLocaleDateString()
                : null

              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/35"
                >
                  <p className="text-sm font-semibold text-foreground">{resource.title}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="muted">{resource.type}</Badge>

                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDuration(resource.durationSeconds)}
                    </span>

                    {resource.sourceMeta?.channel ? (
                      <span className="inline-flex items-center gap-1">
                        <Radio className="h-3.5 w-3.5" />
                        {resource.sourceMeta.channel}
                      </span>
                    ) : null}

                    <Badge variant={quality.variant} className="gap-1">
                      <SignalHigh className="h-3 w-3" />
                      {quality.label}
                    </Badge>

                    {refreshedAt ? <span>Refreshed {refreshedAt}</span> : null}
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
