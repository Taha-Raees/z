export type AdmissionsSessionVM = {
  sessionId: string | null
  questionNumber: number
  progress: number
  question: {
    key: string
    prompt: string
    rationale?: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
    options?: string[]
  } | null
  isComplete: boolean
}

export type BuildPipelineVM = {
  jobId: string | null
  programId: string | null
  status: string | null
  phase: string | null
  item: string | null
  retryCount: number
  maxRetries: number
  lessonProgress: {
    completed: number
    total: number
    percent: number
  }
  moduleProgress: {
    completed: number
    total: number
  }
  error: string | null
}

export type ProgramCardVM = {
  id: string
  topic: string
  levelPath: string
  status: string
  progressPercent: number
  moduleCount: number
  lessonCount: number
  completedLessonCount: number
  targetDate: string
  buildState?: {
    status: string
    phase: string | null
    item: string | null
    retryCount: number
    maxRetries: number
    error: string | null
  }
}

export type LessonClassroomVM = {
  lessonId: string
  title: string
  moduleTitle: string
  programTitle: string
  buildStatus: string
  estimatedMinutes: number
  objectives: string[]
  notesSummary: string | null
  glossary: Array<{ term: string; definition: string }>
  resources: Array<{
    id: string
    type: string
    title: string
    url: string
    durationSeconds: number | null
    qualityScore: number
    channel?: string
    refreshedAt?: string
  }>
}

export type PracticeSetVM = {
  exerciseSetId: string
  lessonId: string
  title: string
  description: string
  difficulty: string
  type: string
  questionCount: number
  latestScore: number | null
}

export type AssessmentRoomVM = {
  assessmentId: string
  title: string
  type: string
  questionCount: number
  attemptCount: number
  recentScores: number[]
  rubricAvailable: boolean
}

export type GradebookVM = {
  totalAssessmentAttempts: number
  totalPracticeAttempts: number
  averageScore: number | null
  latestAssessments: Array<{
    id: string
    title: string
    type: string
    program: string
    score: number | null
    date: string
  }>
  latestPractice: Array<{
    id: string
    lessonTitle: string
    program: string
    score: number | null
    date: string
  }>
}
