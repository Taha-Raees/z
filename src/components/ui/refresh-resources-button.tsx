'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { refreshLessonResources } from '@/lib/api'
import type { LessonResource } from '@/lib/api'

interface RefreshResourcesButtonProps {
  lessonId: string
  onRefresh: (resources: LessonResource[]) => void
}

export function RefreshResourcesButton({ lessonId, onRefresh }: RefreshResourcesButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setStatus('idle')
    setMessage('')

    try {
      const data = await refreshLessonResources(lessonId)
      setStatus('success')
      setMessage(`Updated ${data.resources.length} resource(s)`)
      onRefresh(data.resources)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to refresh resources')
    } finally {
      setIsRefreshing(false)
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 4500)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handleRefresh} disabled={isRefreshing} variant="secondary" size="sm">
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh resources'}
      </Button>

      {status === 'success' ? (
        <span className="flex items-center gap-1 text-xs text-emerald-700" role="status">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {message}
        </span>
      ) : null}

      {status === 'error' ? (
        <span className="flex items-center gap-1 text-xs text-red-700" role="status">
          <AlertCircle className="h-3.5 w-3.5" />
          {message}
        </span>
      ) : null}
    </div>
  )
}
