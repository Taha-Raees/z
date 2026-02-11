/**
 * Context Store (v0.2)
 * Provides lightweight context/RAG for LLM calls to remain aware of course + lesson context
 */

import { prisma } from './prisma'
import type { StudentOnboardingProfile, ProgramBlueprint, ModuleBlueprint, LessonBlueprint } from './schemas'

export interface ProgramContextData {
  profileSummary: string
  planSummary: string
  moduleOutlines: Array<{
    index: number
    title: string
    outcomes: string[]
  }>
  constraints: {
    targetDate: string
    hoursPerDay: number
    currentLevel: string
    goalLevel: string
  }
  languagePolicy: {
    contentLanguage: string
    instructionLanguage: string
    strictTargetLanguage: boolean
  }
}

export interface ProgramConstraints {
  targetDate: string
  hoursPerDay: number
  currentLevel: string
  goalLevel: string
}

export interface LessonContextData {
  objectives: string[]
  notesSummary: string
  keyTopics: string[]
  difficultyLevel: string
  expectedMinutes: number
  resourcePlan?: ResourcePlan
}

export interface ResourcePlan {
  targetVideoCount: number // 2-10
  targetReadingCount?: number
  preferredFormat?: 'tutorial' | 'playlist' | 'lecture' | 'mixed'
  rationale: string
}

export interface ContextPack {
  programContext: ProgramContextData | null
  lessonContext: LessonContextData | null
  moduleContext: {
    index: number
    title: string
    outcomes: string[]
  } | null
  formattedPrompt: string
}

/**
 * Create or update program context
 */
export async function upsertProgramContext(
  programId: string,
  profile: StudentOnboardingProfile,
  blueprint: ProgramBlueprint
): Promise<void> {
  const profileSummary = `Student wants to learn ${profile.topic} from ${profile.currentLevel} to ${profile.goalLevel}. 
    Target: ${profile.targetDate}. 
    Pace: ${profile.pacePreference} (${profile.hoursPerDay}h/day). 
    Preferences: Video ${profile.learningPreferences.videoPreference}%, Reading ${profile.learningPreferences.readingPreference}%.`

  const planSummary = `Program: ${blueprint.title}. ${blueprint.description}. 
    ${blueprint.modules.length} modules, ${blueprint.totalLessons} lessons, 
    ${blueprint.totalHours} hours total, ${blueprint.estimatedWeeks} weeks.`

  const moduleOutlines = blueprint.modules.map(m => ({
    index: m.index,
    title: m.title,
    outcomes: m.outcomes,
  }))

  const constraints: ProgramConstraints = {
    targetDate: profile.targetDate,
    hoursPerDay: profile.hoursPerDay,
    currentLevel: profile.currentLevel,
    goalLevel: profile.goalLevel,
  }

  const languagePolicy = {
    contentLanguage: profile.contentLanguage,
    instructionLanguage: profile.instructionLanguage,
    strictTargetLanguage: profile.strictTargetLanguage,
  }

  await prisma.programContext.upsert({
    where: { programId },
    create: {
      programId,
      profileSummary,
      planSummary,
      moduleOutlinesJson: JSON.stringify(moduleOutlines),
      constraintsJson: JSON.stringify(constraints),
      languagePolicyJson: JSON.stringify(languagePolicy),
    },
    update: {
      profileSummary,
      planSummary,
      moduleOutlinesJson: JSON.stringify(moduleOutlines),
      constraintsJson: JSON.stringify(constraints),
      languagePolicyJson: JSON.stringify(languagePolicy),
    },
  })
}

/**
 * Create or update lesson context
 */
export async function upsertLessonContext(
  lessonId: string,
  lessonBlueprint: LessonBlueprint,
  notesSummary: string = '',
  resourcePlan?: ResourcePlan
): Promise<void> {
  const objectives = lessonBlueprint.objectives
  const keyTopics = lessonBlueprint.keyTopics
  const difficultyLevel = inferDifficultyLevel(lessonBlueprint)
  const expectedMinutes = lessonBlueprint.estimatedMinutes

  await prisma.lessonContext.upsert({
    where: { lessonId },
    create: {
      lessonId,
      objectivesJson: JSON.stringify(objectives),
      notesSummary,
      keyTopicsJson: JSON.stringify(keyTopics),
      difficultyLevel,
      expectedMinutes,
      resourcePlanJson: resourcePlan ? JSON.stringify(resourcePlan) : '{}',
    },
    update: {
      objectivesJson: JSON.stringify(objectives),
      notesSummary,
      keyTopicsJson: JSON.stringify(keyTopics),
      difficultyLevel,
      expectedMinutes,
      resourcePlanJson: resourcePlan ? JSON.stringify(resourcePlan) : '{}',
    },
  })
}

/**
 * Get program context
 */
export async function getProgramContext(programId: string): Promise<ProgramContextData | null> {
  const context = await prisma.programContext.findUnique({
    where: { programId },
  })

  if (!context) return null

  const constraints = safeParseJson<ProgramConstraints>(context.constraintsJson)
  const languagePolicy = safeParseJson<{ contentLanguage: string; instructionLanguage: string; strictTargetLanguage: boolean }>(context.languagePolicyJson)

  return {
    profileSummary: context.profileSummary,
    planSummary: context.planSummary,
    moduleOutlines: safeParseJson(context.moduleOutlinesJson) ?? [],
    constraints: constraints ?? {
      targetDate: '',
      hoursPerDay: 1,
      currentLevel: 'beginner',
      goalLevel: 'intermediate',
    },
    languagePolicy: languagePolicy ?? {
      contentLanguage: 'en',
      instructionLanguage: 'en',
      strictTargetLanguage: false,
    },
  }
}

/**
 * Get lesson context
 */
export async function getLessonContext(lessonId: string): Promise<LessonContextData | null> {
  const context = await prisma.lessonContext.findUnique({
    where: { lessonId },
  })

  if (!context) return null

  return {
    objectives: safeParseJson(context.objectivesJson) ?? [],
    notesSummary: context.notesSummary,
    keyTopics: safeParseJson(context.keyTopicsJson) ?? [],
    difficultyLevel: context.difficultyLevel ?? 'intermediate',
    expectedMinutes: context.expectedMinutes ?? 30,
  }
}

/**
 * Build context pack for LLM calls
 * This is the main entry point for agents to get relevant context
 */
export async function buildContextPack(options: {
  programId: string
  lessonId?: string
  moduleId?: string
}): Promise<ContextPack> {
  const { programId, lessonId, moduleId } = options

  const programContext = await getProgramContext(programId)
  let lessonContext: LessonContextData | null = null
  let moduleContext: { index: number; title: string; outcomes: string[] } | null = null

  // Get lesson context if lessonId is provided
  if (lessonId) {
    lessonContext = await getLessonContext(lessonId)
  }

  // Get module context if moduleId is provided
  if (moduleId) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    })
    if (module) {
      moduleContext = {
        index: module.index,
        title: module.title,
        outcomes: safeParseJson(module.outcomesJson) ?? [],
      }
    }
  }

  // Build formatted prompt for LLM
  const formattedPrompt = formatContextPrompt({
    programContext,
    lessonContext,
    moduleContext,
  })

  return {
    programContext,
    lessonContext,
    moduleContext,
    formattedPrompt,
  }
}

/**
 * Format context into a prompt string for LLM
 */
function formatContextPrompt(options: {
  programContext: ProgramContextData | null
  lessonContext: LessonContextData | null
  moduleContext: { index: number; title: string; outcomes: string[] } | null
}): string {
  const parts: string[] = []

  if (options.programContext) {
    const pc = options.programContext
    parts.push(`=== PROGRAM CONTEXT ===`)
    parts.push(`Topic: ${pc.profileSummary}`)
    parts.push(`Plan: ${pc.planSummary}`)
    parts.push(`Target: ${pc.constraints.currentLevel} → ${pc.constraints.goalLevel}`)
    parts.push(`Language: ${pc.languagePolicy.contentLanguage} (content), ${pc.languagePolicy.instructionLanguage} (instruction)`)
    parts.push(`Strict language: ${pc.languagePolicy.strictTargetLanguage}`)
  }

  if (options.moduleContext) {
    const mc = options.moduleContext
    parts.push(`\n=== MODULE CONTEXT ===`)
    parts.push(`Module ${mc.index + 1}: ${mc.title}`)
    parts.push(`Outcomes:\n${mc.outcomes.map(o => `  - ${o}`).join('\n')}`)
  }

  if (options.lessonContext) {
    const lc = options.lessonContext
    parts.push(`\n=== LESSON CONTEXT ===`)
    parts.push(`Objectives:\n${lc.objectives.map(o => `  - ${o}`).join('\n')}`)
    parts.push(`Key Topics: ${lc.keyTopics.join(', ')}`)
    parts.push(`Difficulty: ${lc.difficultyLevel}, Duration: ${lc.expectedMinutes}min`)
    if (lc.notesSummary) {
      parts.push(`Notes Summary: ${lc.notesSummary}`)
    }
  }

  return parts.join('\n')
}

/**
 * Infer difficulty level from lesson blueprint
 */
function inferDifficultyLevel(lesson: LessonBlueprint): string {
  const estimatedMinutes = lesson.estimatedMinutes || 30
  const objectivesCount = lesson.objectives.length

  if (estimatedMinutes < 30 || objectivesCount <= 2) {
    return 'beginner'
  } else if (estimatedMinutes > 60 || objectivesCount >= 5) {
    return 'advanced'
  }
  return 'intermediate'
}

/**
 * Safe JSON parse helper
 */
function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * Delete program context (for cleanup)
 */
export async function deleteProgramContext(programId: string): Promise<void> {
  await prisma.programContext.delete({
    where: { programId },
  }).catch(() => {
    // Ignore if not found
  })
}

/**
 * Delete lesson context (for cleanup)
 */
export async function deleteLessonContext(lessonId: string): Promise<void> {
  await prisma.lessonContext.delete({
    where: { lessonId },
  }).catch(() => {
    // Ignore if not found
  })
}

/**
 * Generate resource plan for a lesson using LLM
 * This determines how many videos/resources a lesson needs based on complexity
 */
export async function generateResourcePlan(
  lessonBlueprint: LessonBlueprint,
  moduleTitle: string,
  programContext: ProgramContextData | null
): Promise<ResourcePlan> {
  const { getOpenRouterClient } = await import('./openrouter/client')
  const { z } = await import('zod')

  const ResourcePlanSchema = z.object({
    targetVideoCount: z.number().min(2).max(10),
    targetReadingCount: z.number().min(0).max(5).optional(),
    preferredFormat: z.enum(['tutorial', 'playlist', 'lecture', 'mixed']).optional(),
    rationale: z.string().min(10).max(200),
  })

  const estimatedMinutes = lessonBlueprint.estimatedMinutes || 30
  const objectivesCount = lessonBlueprint.objectives.length

  // Build prompt for LLM
  const prompt = `You are a curriculum planner. Decide how many learning resources this lesson needs.

Lesson: ${lessonBlueprint.title}
Module: ${moduleTitle}
Estimated duration: ${estimatedMinutes} minutes
Objectives (${objectivesCount}):
${lessonBlueprint.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${programContext ? `Program context: ${programContext.profileSummary}` : ''}

Return a JSON object with:
{
  "targetVideoCount": number (2-10, based on lesson complexity),
  "targetReadingCount": number (0-5, optional),
  "preferredFormat": "tutorial" | "playlist" | "lecture" | "mixed" (optional),
  "rationale": "brief explanation of your decision"
}

Guidelines:
- Longer lessons (60+ min) need more videos (6-10)
- Shorter lessons (30-45 min) need fewer videos (2-5)
- Complex topics benefit from playlists
- Practical skills benefit from tutorials
- Theory-heavy topics benefit from lectures`

  try {
    const client = getOpenRouterClient()
    const result = await client.chatCompletionWithSchema(
      {
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: 'You are a curriculum planning assistant. Return strict JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      ResourcePlanSchema,
      2
    )

    return result as ResourcePlan
  } catch (error) {
    // Fallback to heuristic if LLM fails
    const baseCount = estimatedMinutes > 60 ? 6 : estimatedMinutes > 45 ? 4 : 3
    return {
      targetVideoCount: Math.min(10, Math.max(2, baseCount + Math.floor(objectivesCount / 2))),
      targetReadingCount: Math.floor(objectivesCount / 2),
      preferredFormat: 'mixed',
      rationale: 'Fallback heuristic based on lesson duration and objectives count.',
    }
  }
}
