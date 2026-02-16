export type AdmissionsQuestion = {
  questionKey: string
  question: string
  rationale?: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  options?: string[]
  required?: boolean
  questionNumber?: number
  progress?: number
}

export type OnboardingProfile = {
  topic: string
  currentLevel: string
  goalLevel: string
  targetDate: string
  hoursPerDay: number
  pacePreference: string
  [key: string]: unknown
}

export type AdmissionsStartResponse = {
  sessionId: string
  currentQuestion: AdmissionsQuestion
}

export type AdmissionsAnswerResponse =
  | {
      isComplete: true
      profile: OnboardingProfile
    }
  | {
      isComplete: false
      nextQuestion: AdmissionsQuestion
    }

export type ProgramBuildQueueResponse = {
  success: boolean
  jobId?: string
  programId?: string
  reused?: boolean
  status?: string
  error?: string
}

export type ProgramBuildStatusResponse = {
  success: boolean
  job: {
    id: string
    programId: string | null
    status: string
    currentPhase: string | null
    currentItem: string | null
    totalModules: number
    completedModules: number
    totalLessons: number
    completedLessons: number
    retryCount: number
    maxRetries: number
    error: string | null
    lastEventIndex: number
    isWorking: boolean
  }
  program?: unknown
  error?: string
}

export type JobSummary = {
  id: string
  userId: string
  programId: string | null
  lessonId?: string | null
  program?: {
    id: string
    topic: string
    goal: string
  } | null
  type: string
  status: string
  currentPhase: string | null
  currentItem: string | null
  totalModules: number | null
  completedModules: number | null
  totalLessons: number | null
  completedLessons: number | null
  retryCount: number
  maxRetries: number
  error: string | null
  startedAt?: string | null
  finishedAt?: string | null
  lastHeartbeatAt?: string | null
  updatedAt?: string
  lastEventIndex?: number | null
  createdAt: string
}

export type JobsListResponse = {
  success: boolean
  jobs: JobSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: string
}

export type JobEvent = {
  id: string
  index: number
  type: string
  step: string
  status: string
  level: string
  message: string | null
  payload: unknown
  createdAt: string
}

export type JobDetailsResponse = {
  success: boolean
  job: JobSummary
  events: JobEvent[]
  eventCount: number
  error?: string
}

export type LessonResource = {
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
  retrievedAt?: string
}

export type LessonResourcesResponse = {
  success: boolean
  lessonId: string
  resources: LessonResource[]
  refreshedAt?: string
  error?: string
}

export type AttemptSubmissionResponse = {
  success: boolean
  attemptId: string
  grading: {
    score: number
    passed: boolean
    feedback: string
  }
  error?: string
}
