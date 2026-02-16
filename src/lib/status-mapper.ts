export type UiTone = 'muted' | 'success' | 'warn' | 'danger' | 'info'

export function mapProgramStatus(status: string): { label: string; tone: UiTone } {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return { label: 'Active', tone: 'success' }
  if (normalized === 'COMPLETED') return { label: 'Completed', tone: 'success' }
  if (normalized === 'PAUSED') return { label: 'Paused', tone: 'warn' }
  if (normalized === 'ARCHIVED') return { label: 'Archived', tone: 'muted' }
  return { label: 'Draft', tone: 'muted' }
}

export function mapBuildStatus(status: string | null | undefined): { label: string; tone: UiTone } {
  const normalized = status?.toUpperCase() ?? 'UNKNOWN'
  if (normalized === 'COMPLETED') return { label: 'Completed', tone: 'success' }
  if (normalized === 'RUNNING') return { label: 'Running', tone: 'warn' }
  if (normalized === 'QUEUED') return { label: 'Queued', tone: 'info' }
  if (normalized === 'FAILED') return { label: 'Failed', tone: 'danger' }
  if (normalized === 'CANCELED') return { label: 'Canceled', tone: 'muted' }
  return { label: 'Pending', tone: 'muted' }
}

export function mapContentBuildStatus(status: string): { label: string; tone: UiTone } {
  const normalized = status.toUpperCase()
  if (normalized === 'COMPLETED') return { label: 'Ready', tone: 'success' }
  if (normalized === 'IN_PROGRESS') return { label: 'Building', tone: 'warn' }
  if (normalized === 'FAILED') return { label: 'Failed', tone: 'danger' }
  return { label: 'Pending', tone: 'muted' }
}

export function mapAttemptScore(score: number | null): { label: string; tone: UiTone } {
  if (score === null) return { label: 'Pending', tone: 'muted' }
  if (score >= 85) return { label: `${Math.round(score)}%`, tone: 'success' }
  if (score >= 70) return { label: `${Math.round(score)}%`, tone: 'info' }
  if (score >= 60) return { label: `${Math.round(score)}%`, tone: 'warn' }
  return { label: `${Math.round(score)}%`, tone: 'danger' }
}
