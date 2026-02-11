/**
 * Zod Schemas for AI Education System
 * All agent outputs must conform to these schemas
 */

import { z } from 'zod'

// ============================================
// Onboarding Schemas
// ============================================

export const StudentOnboardingProfileSchema = z.object({
  topic: z.string().describe('The subject/topic the student wants to learn'),
  currentLevel: z.string().describe('Current proficiency level (e.g., A1, beginner, intermediate)'),
  goalLevel: z.string().describe('Target proficiency level (e.g., B1, advanced)'),
  targetDate: z.string().describe('Target completion date (ISO format)'),
  contentLanguage: z.string().default('English').describe('Target language used for learner-facing generated content'),
  instructionLanguage: z.string().default('English').describe('Language used for UI/system instruction text'),
  strictTargetLanguage: z.boolean().default(true).describe('When true, generated learner content must remain in contentLanguage'),
  hoursPerDay: z.number().min(0.5).max(12).describe('Available hours per day'),
  hoursPerWeek: z.number().min(1).max(84).describe('Available hours per week'),
  pacePreference: z.enum(['intensive', 'normal', 'light']).describe('Preferred learning pace'),
  learningPreferences: z.object({
    videoPreference: z.number().min(0).max(100).describe('Percentage of video content preferred'),
    readingPreference: z.number().min(0).max(100).describe('Percentage of reading content preferred'),
    speakingFocus: z.boolean().describe('Whether to focus on speaking practice'),
    writingFocus: z.boolean().describe('Whether to focus on writing practice'),
    listeningFocus: z.boolean().describe('Whether to focus on listening practice'),
  }),
  constraints: z.object({
    device: z.string().optional().describe('Device constraints (mobile, desktop, etc.)'),
    accessibility: z.string().optional().describe('Accessibility requirements'),
    examFormat: z.string().optional().describe('Target exam format if any'),
  }),
  additionalNotes: z.string().optional().describe('Any additional notes or requirements'),
})

export type StudentOnboardingProfile = z.infer<typeof StudentOnboardingProfileSchema>

// ============================================
// Program Schemas
// ============================================

export const ModuleBlueprintSchema = z.object({
  index: z.number(),
  title: z.string(),
  description: z.string(),
  outcomes: z.array(z.string()),
  estimatedHours: z.number(),
  lessonsCount: z.number(),
})

export type ModuleBlueprint = z.infer<typeof ModuleBlueprintSchema>

export const LessonBlueprintSchema = z.object({
  index: z.number(),
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  estimatedMinutes: z.number(),
  keyTopics: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
})

export type LessonBlueprint = z.infer<typeof LessonBlueprintSchema>

export const ProgramBlueprintSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(ModuleBlueprintSchema),
  totalLessons: z.number(),
  totalHours: z.number(),
  estimatedWeeks: z.number(),
  milestones: z.array(z.object({
    title: z.string(),
    week: z.number(),
    description: z.string(),
  })),
})

export type ProgramBlueprint = z.infer<typeof ProgramBlueprintSchema>

// ============================================
// Resource Schemas
// ============================================

export const ResourceCandidateSchema = z.object({
  type: z.enum(['youtube', 'article', 'book', 'podcast', 'other']),
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  durationSeconds: z.number().nullable().optional(),
  channel: z.string().nullable().optional(),
  qualityScore: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  reason: z.string().describe('Why this resource was selected'),
})

export type ResourceCandidate = z.infer<typeof ResourceCandidateSchema>

// ============================================
// Lesson Content Schemas
// ============================================

export const LessonNotesSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  glossary: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    example: z.string().optional(),
  })),
  guidedNotes: z.array(z.object({
    section: z.string(),
    content: z.string(),
    questions: z.array(z.string()).optional(),
  })),
  additionalResources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
})

export type LessonNotes = z.infer<typeof LessonNotesSchema>

// ============================================
// Exercise Schemas
// ============================================

export const MCQQuestionSchema = z.object({
  type: z.literal('mcq'),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const TrueFalseQuestionSchema = z.object({
  type: z.literal('true_false'),
  question: z.string(),
  correctAnswer: z.boolean(),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const MatchingQuestionSchema = z.object({
  type: z.literal('matching'),
  question: z.string(),
  pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const ClozeQuestionSchema = z.object({
  type: z.literal('cloze'),
  question: z.string(),
  blanks: z.array(z.object({
    index: z.number(),
    answer: z.string(),
    alternatives: z.array(z.string()).optional(),
  })),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const ShortAnswerQuestionSchema = z.object({
  type: z.literal('short_answer'),
  question: z.string(),
  expectedAnswer: z.string(),
  keywords: z.array(z.string()),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const ListeningQuestionSchema = z.object({
  type: z.literal('listening'),
  question: z.string(),
  audioUrl: z.string().url().optional(),
  transcript: z.string().optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const ReadingQuestionSchema = z.object({
  type: z.literal('reading'),
  passage: z.string(),
  question: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const SpeakingQuestionSchema = z.object({
  type: z.literal('speaking'),
  prompt: z.string(),
  rubric: z.object({
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      maxPoints: z.number(),
    })),
  }),
  timeLimitSeconds: z.number().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const WritingQuestionSchema = z.object({
  type: z.literal('writing'),
  prompt: z.string(),
  rubric: z.object({
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      maxPoints: z.number(),
    })),
  }),
  wordLimit: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export const ExerciseQuestionSchema = z.discriminatedUnion('type', [
  MCQQuestionSchema,
  TrueFalseQuestionSchema,
  MatchingQuestionSchema,
  ClozeQuestionSchema,
  ShortAnswerQuestionSchema,
  ListeningQuestionSchema,
  ReadingQuestionSchema,
  SpeakingQuestionSchema,
  WritingQuestionSchema,
])

export type ExerciseQuestion = z.infer<typeof ExerciseQuestionSchema>

export const ExerciseSetSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  type: z.enum(['mixed', 'reading', 'listening', 'speaking', 'writing', 'grammar', 'vocabulary']),
  estimatedMinutes: z.number(),
  questions: z.array(ExerciseQuestionSchema),
  instructions: z.string().optional(),
})

export type ExerciseSet = z.infer<typeof ExerciseSetSchema>

// ============================================
// Assessment Schemas
// ============================================

export const RubricCriteriaSchema = z.object({
  name: z.string(),
  description: z.string(),
  maxPoints: z.number(),
  levels: z.array(z.object({
    score: z.number(),
    description: z.string(),
  })),
})

export type RubricCriteria = z.infer<typeof RubricCriteriaSchema>

export const RubricSchema = z.object({
  criteria: z.array(RubricCriteriaSchema),
  totalPoints: z.number(),
  passingScore: z.number(),
})

export type Rubric = z.infer<typeof RubricSchema>

export const AssessmentSchema = z.object({
  type: z.enum(['quiz', 'test', 'exam']),
  title: z.string(),
  description: z.string(),
  timeLimitMinutes: z.number().optional(),
  questions: z.array(ExerciseQuestionSchema),
  rubric: RubricSchema.optional(),
  passingScore: z.number(),
  instructions: z.string().optional(),
})

export type Assessment = z.infer<typeof AssessmentSchema>

// ============================================
// Grading Schemas
// ============================================

export const GradingResultSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  feedback: z.string(),
  detailedFeedback: z.array(z.object({
    questionIndex: z.number(),
    score: z.number(),
    feedback: z.string(),
    correctAnswer: z.string().optional(),
  })),
  improvementPlan: z.array(z.object({
    topic: z.string(),
    action: z.string(),
    resources: z.array(z.string()).optional(),
  })),
})

export type GradingResult = z.infer<typeof GradingResultSchema>

// ============================================
// Daily Plan Schemas
// ============================================

export const DailyPlanItemSchema = z.object({
  type: z.enum(['lesson', 'exercise', 'quiz', 'test', 'exam', 'review', 'break']),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  priority: z.enum(['high', 'medium', 'low']),
  completed: z.boolean().default(false),
  refId: z.string().optional(),
})

export type DailyPlanItem = z.infer<typeof DailyPlanItemSchema>

export const DailyPlanSchema = z.object({
  date: z.string(),
  totalEstimatedMinutes: z.number(),
  items: z.array(DailyPlanItemSchema),
  notes: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
})

export type DailyPlan = z.infer<typeof DailyPlanSchema>

// ============================================
// Agent Output Schemas
// ============================================

export const AgentOutputSchema = z.object({
  agentName: z.string(),
  timestamp: z.string(),
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type AgentOutput = z.infer<typeof AgentOutputSchema>
