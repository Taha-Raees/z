'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

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
  }
  retrievedAt: string
}

interface RefreshResourcesButtonProps {
  lessonId: string
  onRefresh: (resources: Resource[]) => void
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
      const response = await fetch(`/api/lessons/${lessonId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(`Refreshed ${data.resources.length} resources`)
        onRefresh(data.resources)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to refresh resources')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to refresh resources')
    } finally {
      setIsRefreshing(false)
      // Clear status after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh resources'}
      </button>
      {status === 'success' && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          {message}
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {message}
        </span>
      )}
    </div>
  )
}
