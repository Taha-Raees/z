import { z } from 'zod'
import { prisma } from '../prisma'
import { getCurriculumArchitectAgent } from '../agents/curriculum-architect'
import { getResourceCuratorAgent } from '../agents/resource-curator'
import { getLessonBuilderAgent } from '../agents/lesson-builder'
import { getExerciseGeneratorAgent } from '../agents/exercise-generator'
import { getAssessmentOfficeAgent } from '../agents/assessment-office'
import { getOpenRouterClient } from '../openrouter/client'
import {
  ExerciseSetSchema,
  LessonNotesSchema,
  type ExerciseSet,
  type ExerciseQuestion,
  type LessonBlueprint,
  type LessonNotes,
  type ModuleBlueprint,
  type ProgramBlueprint,
  type ResourceCandidate,
  type StudentOnboardingProfile,
} from '../schemas'
import { buildLanguageDirective, resolveLanguagePolicy, violatesTargetLanguage } from '../language'
import {
  appendBuildEvent,
  claimBuildJob,
  getBuildJobOrThrow,
  getBuildCheckpoint,
  markBuildJobFailedIfStale,
  persistProgramBlueprint,
  updateBuildCheckpoint,
  updateBuildJobState,
} from './program-build-store'
import {
  upsertProgramContext,
  upsertLessonContext,
  buildContextPack,
  generateResourcePlan,
} from '../context-store'

const inMemoryRunningJobs = new Set<string>()

const ModuleLessonPlanSchema = z.object({
  lessons: z.array(
    z.object({
      title: z.string(),
      objectives: z.array(z.string()).min(1).max(5),
      estimatedMinutes: z.number().min(20).max(120).optional(),
    })
  ),
})

const MAX_MODULES = 6
const MAX_LESSONS_PER_MODULE = 12

export async function enqueueProgramBuildJob(jobId: string): Promise<void> {
  if (inMemoryRunningJobs.has(jobId)) return

  inMemoryRunningJobs.add(jobId)
  void runProgramBuildJob(jobId)
    .catch((error) => {
      console.error(`Program build job ${jobId} crashed`, error)
    })
    .finally(() => {
      inMemoryRunningJobs.delete(jobId)
    })
}

export async function runProgramBuildJob(jobId: string): Promise<void> {
  const claim = await claimBuildJob(jobId)
  if (claim !== 'claimed') {
    if (claim === 'already_running') {
      await markBuildJobFailedIfStale(jobId)
    }
    return
  }

  const job = await getBuildJobOrThrow(jobId)
  const profile = safeParseJson<StudentOnboardingProfile>(job.inputProfileJson)
  if (!profile) {
    await updateBuildJobState(jobId, {
      status: 'FAILED',
      error: 'Invalid onboarding profile payload in job',
      finishedAt: new Date(),
      currentPhase: 'failed',
    })
    await appendBuildEvent(jobId, {
      type: 'job.failed',
      step: 'Initialize',
      status: 'FAILED',
      level: 'ERROR',
      message: 'Invalid onboarding profile payload in job',
    })
    return
  }

  // Get checkpoint data for resumable builds
  const checkpoint = await getBuildCheckpoint(jobId)
  const isRetry = job.retryCount > 0

  let failedModules = 0
  const languagePolicy = resolveLanguagePolicy({
    contentLanguage: profile.contentLanguage,
    instructionLanguage: profile.instructionLanguage,
    strictTargetLanguage: profile.strictTargetLanguage,
  })

  try {
    await appendBuildEvent(jobId, {
      type: 'job.started',
      step: 'Initialize',
      status: 'IN_PROGRESS',
      message: isRetry
        ? `Program build worker started (retry #${job.retryCount}, resuming from: ${checkpoint.stepKey || 'start'})`
        : 'Program build worker started',
      payload: {
        programId: job.programId,
        isRetry,
        checkpoint,
      },
    })

    await updateBuildJobState(jobId, {
      status: 'RUNNING',
      currentPhase: 'plan',
      currentItem: 'program-blueprint',
      startedAt: job.startedAt ?? new Date(),
      lastHeartbeatAt: new Date(),
      error: null,
    })

    // Skip planning phase if already completed (on retry)
    let blueprint: ProgramBlueprint
    if (checkpoint.stepKey === 'plan' || !job.planJson) {
      const curriculumAgent = getCurriculumArchitectAgent()
      const rawBlueprint = await curriculumAgent.generateProgram(profile, languagePolicy)
      const repairedBlueprint = await ensureBlueprintLanguagePolicy(profile, rawBlueprint, languagePolicy)
      blueprint = normalizeBlueprint(repairedBlueprint)

      await persistProgramBlueprint(jobId, blueprint, isRetry)

      // Create program context for RAG/context awareness
      await upsertProgramContext(job.programId, profile, blueprint)

      await appendBuildEvent(jobId, {
        type: 'phase.plan.completed',
        step: 'Plan',
        status: 'COMPLETED',
        message: 'Program blueprint planned and persisted',
        payload: {
          moduleCount: blueprint.modules.length,
          lessonCount: blueprint.modules.reduce((acc, module) => acc + module.lessonsCount, 0),
        },
      })
    } else {
      // Load existing blueprint from job
      blueprint = safeParseJson<ProgramBlueprint>(job.planJson) || {
        title: profile.topic,
        description: `Learning path for ${profile.topic}`,
        modules: [],
        totalLessons: 0,
        totalHours: 0,
        estimatedWeeks: 0,
        milestones: [],
      }
      await appendBuildEvent(jobId, {
        type: 'phase.plan.skipped',
        step: 'Plan',
        status: 'SKIPPED',
        message: 'Using existing blueprint from previous run',
      })
    }

    // Process modules, starting from checkpoint if available
    const startModuleIndex = checkpoint.moduleIndex !== null ? checkpoint.moduleIndex + 1 : 0
    for (let moduleIndex = startModuleIndex; moduleIndex < blueprint.modules.length; moduleIndex++) {
      const moduleBlueprint = blueprint.modules[moduleIndex]
      const moduleResult = await processModule(jobId, profile, moduleBlueprint, languagePolicy, moduleIndex)
      if (!moduleResult.success) {
        failedModules += 1
      }

      // Update checkpoint after each module
      await updateBuildCheckpoint(jobId, {
        moduleIndex,
        stepKey: `module_${moduleIndex}`,
      })

      await updateBuildJobState(jobId, {
        completedModules: await prisma.module.count({
          where: {
            programId: job.programId,
            buildStatus: 'COMPLETED',
          },
        }),
        completedLessons: await prisma.lesson.count({
          where: {
            module: { programId: job.programId },
            buildStatus: 'COMPLETED',
          },
        }),
        lastHeartbeatAt: new Date(),
      })
    }

    await updateBuildJobState(jobId, {
      currentPhase: 'assessments',
      currentItem: 'final-exam',
      lastHeartbeatAt: new Date(),
    })

    await appendBuildEvent(jobId, {
      type: 'phase.assessments.started',
      step: 'Assessments',
      status: 'IN_PROGRESS',
      message: 'Generating cross-module final assessment artifacts',
    })

    await ensureFinalExam(jobId, blueprint, languagePolicy)

    await appendBuildEvent(jobId, {
      type: 'phase.assessments.completed',
      step: 'Assessments',
      status: 'COMPLETED',
      message: 'Assessment generation completed',
    })

    await updateBuildJobState(jobId, {
      currentPhase: 'schedule',
      currentItem: 'build-calendar',
      lastHeartbeatAt: new Date(),
    })

    await appendBuildEvent(jobId, {
      type: 'phase.schedule.started',
      step: 'Schedule',
      status: 'IN_PROGRESS',
      message: 'Building deterministic schedule',
    })

    await buildDeterministicSchedule(job.programId, blueprint, profile)

    await appendBuildEvent(jobId, {
      type: 'phase.schedule.completed',
      step: 'Schedule',
      status: 'COMPLETED',
      message: 'Schedule generated and persisted',
    })

    await prisma.program.update({
      where: { id: job.programId },
      data: {
        status: 'ACTIVE',
      },
    })

    await updateBuildJobState(jobId, {
      status: 'COMPLETED',
      currentPhase: 'completed',
      currentItem: null,
      finishedAt: new Date(),
      error:
        failedModules > 0
          ? `Completed with ${failedModules} module(s) having failures. Check event log.`
          : null,
      completedModules: await prisma.module.count({
        where: {
          programId: job.programId,
          buildStatus: 'COMPLETED',
        },
      }),
      completedLessons: await prisma.lesson.count({
        where: {
          module: { programId: job.programId },
          buildStatus: 'COMPLETED',
        },
      }),
    })

    await appendBuildEvent(jobId, {
      type: 'job.completed',
      step: 'Complete',
      status: 'COMPLETED',
      level: failedModules > 0 ? 'WARN' : 'INFO',
      message:
        failedModules > 0
          ? `Program build finished with partial failures (${failedModules} modules).`
          : 'Program build finished successfully.',
      payload: {
        failedModules,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown build error'

    await updateBuildJobState(jobId, {
      status: 'FAILED',
      currentPhase: 'failed',
      error: message,
      finishedAt: new Date(),
      lastHeartbeatAt: new Date(),
    })

    await appendBuildEvent(jobId, {
      type: 'job.failed',
      step: 'Complete',
      status: 'FAILED',
      level: 'ERROR',
      message,
    })
  }
}

async function processModule(
  jobId: string,
  profile: StudentOnboardingProfile,
  moduleBlueprint: ModuleBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>,
  moduleIndex: number
): Promise<{ success: boolean }> {
  const job = await getBuildJobOrThrow(jobId)
  const checkpoint = await getBuildCheckpoint(jobId)

  const dbModule = await prisma.module.findFirst({
    where: {
      programId: job.programId,
      index: moduleBlueprint.index,
    },
    include: {
      lessons: {
        orderBy: { index: 'asc' },
      },
    },
  })

  if (!dbModule) {
    await appendBuildEvent(jobId, {
      type: 'module.failed',
      step: `Module ${moduleBlueprint.index + 1}`,
      status: 'FAILED',
      level: 'ERROR',
      message: `Module record not found for index ${moduleBlueprint.index}`,
    })
    return { success: false }
  }

  if (dbModule.buildStatus === 'COMPLETED') {
    await appendBuildEvent(jobId, {
      type: 'module.skipped',
      step: `Module ${moduleBlueprint.index + 1}`,
      status: 'SKIPPED',
      message: `Module already completed: ${dbModule.title}`,
    })
    return { success: true }
  }

  await prisma.module.update({
    where: { id: dbModule.id },
    data: {
      buildStatus: 'IN_PROGRESS',
      buildError: null,
    },
  })

  await updateBuildJobState(jobId, {
    currentPhase: 'module',
    currentItem: dbModule.title,
    lastHeartbeatAt: new Date(),
  })

  await appendBuildEvent(jobId, {
    type: 'module.started',
    step: `Module ${moduleBlueprint.index + 1}`,
    status: 'IN_PROGRESS',
    message: `Starting module: ${dbModule.title}`,
    payload: {
      moduleId: dbModule.id,
      moduleIndex: moduleBlueprint.index,
      moduleTitle: dbModule.title,
    },
  })

  try {
    const plannedLessons = await ensureModuleLessonPlan(
      jobId,
      profile,
      moduleBlueprint,
      dbModule.id,
      languagePolicy
    )

    // Determine starting lesson index from checkpoint
    // Only skip lessons if we're in the same module as the checkpoint
    const startLessonIndex = (checkpoint.moduleIndex === moduleIndex && checkpoint.lessonIndex !== null)
      ? checkpoint.lessonIndex + 1
      : 0

    for (let lessonIndex = startLessonIndex; lessonIndex < plannedLessons.length; lessonIndex++) {
      const lessonPlan = plannedLessons[lessonIndex]
      await processLesson(
        jobId,
        profile,
        moduleBlueprint,
        dbModule.id,
        lessonIndex,
        lessonPlan.lesson,
        languagePolicy,
        job.programId
      )

      // Update checkpoint after each lesson
      await updateBuildCheckpoint(jobId, {
        moduleIndex,
        lessonIndex,
        stepKey: `module_${moduleIndex}_lesson_${lessonIndex}`,
      })
    }

    await ensureModuleQuiz(jobId, moduleBlueprint, dbModule.id, languagePolicy)

    await prisma.module.update({
      where: { id: dbModule.id },
      data: {
        buildStatus: 'COMPLETED',
        buildError: null,
      },
    })

    await appendBuildEvent(jobId, {
      type: 'module.completed',
      step: `Module ${moduleBlueprint.index + 1}`,
      status: 'COMPLETED',
      message: `Completed module: ${dbModule.title}`,
      payload: {
        moduleId: dbModule.id,
      },
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Module processing failed'

    await prisma.module.update({
      where: { id: dbModule.id },
      data: {
        buildStatus: 'FAILED',
        buildError: message,
      },
    })

    await appendBuildEvent(jobId, {
      type: 'module.failed',
      step: `Module ${moduleBlueprint.index + 1}`,
      status: 'FAILED',
      level: 'ERROR',
      message,
      payload: {
        moduleId: dbModule.id,
      },
    })

    return { success: false }
  }
}

async function ensureModuleLessonPlan(
  jobId: string,
  profile: StudentOnboardingProfile,
  moduleBlueprint: ModuleBlueprint,
  moduleId: string,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
) {
  const existing = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { index: 'asc' },
  })

  const requiredCount = Math.max(1, Math.min(moduleBlueprint.lessonsCount, MAX_LESSONS_PER_MODULE))
  if (existing.length >= requiredCount) {
    return existing.slice(0, requiredCount).map((lesson) => ({
      index: lesson.index,
      lesson: {
        title: lesson.title,
        objectives: safeParseJson<string[]>(lesson.objectivesJson) ?? moduleBlueprint.outcomes.slice(0, 3),
        estimatedMinutes: lesson.estimatedMinutes,
      },
    }))
  }

  await appendBuildEvent(jobId, {
    type: 'module.plan_lessons.started',
    step: `Module ${moduleBlueprint.index + 1}`,
    status: 'IN_PROGRESS',
    message: `Planning ${requiredCount} lessons for ${moduleBlueprint.title}`,
  })

  const generatedPlan = await planLessonsForModule(profile, moduleBlueprint, requiredCount, languagePolicy)

  for (let index = 0; index < requiredCount; index++) {
    const plan = generatedPlan[index] ?? {
      title: `Lesson ${index + 1}: ${moduleBlueprint.title}`,
      objectives: moduleBlueprint.outcomes.slice(0, 3),
      estimatedMinutes: 45,
    }

    await prisma.lesson.upsert({
      where: {
        moduleId_index: {
          moduleId,
          index,
        },
      },
      create: {
        moduleId,
        index,
        title: plan.title,
        objectivesJson: JSON.stringify(plan.objectives),
        estimatedMinutes: plan.estimatedMinutes ?? 45,
        buildStatus: 'PENDING',
      },
      update: {
        title: plan.title,
        objectivesJson: JSON.stringify(plan.objectives),
        estimatedMinutes: plan.estimatedMinutes ?? 45,
      },
    })
  }

  await appendBuildEvent(jobId, {
    type: 'module.plan_lessons.completed',
    step: `Module ${moduleBlueprint.index + 1}`,
    status: 'COMPLETED',
    message: `Lesson plan generated for ${moduleBlueprint.title}`,
    payload: {
      lessonCount: requiredCount,
    },
  })

  const finalLessons = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { index: 'asc' },
    take: requiredCount,
  })

  return finalLessons.map((lesson) => ({
    index: lesson.index,
    lesson: {
      title: lesson.title,
      objectives: safeParseJson<string[]>(lesson.objectivesJson) ?? moduleBlueprint.outcomes.slice(0, 3),
      estimatedMinutes: lesson.estimatedMinutes,
    },
  }))
}

async function processLesson(
  jobId: string,
  profile: StudentOnboardingProfile,
  moduleBlueprint: ModuleBlueprint,
  moduleId: string,
  lessonIndex: number,
  lessonPlan: {
    title: string
    objectives: string[]
    estimatedMinutes?: number
  },
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>,
  programId: string
) {
  const heartbeat = async () => {
    await updateBuildJobState(jobId, {
      lastHeartbeatAt: new Date(),
    })
  }

  const withHeartbeat = async <T>(work: () => Promise<T>): Promise<T> => {
    await heartbeat()

    const interval = setInterval(() => {
      void updateBuildJobState(jobId, {
        lastHeartbeatAt: new Date(),
      }).catch(() => {
        // Ignore heartbeat update errors during long-running calls
      })
    }, 12_000)

    try {
      return await work()
    } finally {
      clearInterval(interval)
      await heartbeat()
    }
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      moduleId,
      index: lessonIndex,
    },
    include: {
      resources: true,
      notes: true,
      exerciseSets: true,
      context: true,
    },
  })

  if (!lesson) return
  if (lesson.buildStatus === 'COMPLETED') return

  const lessonBlueprint: LessonBlueprint = {
    index: lessonIndex,
    title: lessonPlan.title,
    description: `${lessonPlan.title} in ${moduleBlueprint.title}`,
    objectives: lessonPlan.objectives,
    estimatedMinutes: lessonPlan.estimatedMinutes ?? lesson.estimatedMinutes ?? 45,
    keyTopics: lessonPlan.objectives.slice(0, 3),
  }

  // Generate resource plan if not already present
  let resourcePlan = lesson.context?.resourcePlanJson
    ? JSON.parse(lesson.context.resourcePlanJson)
    : null

  if (!resourcePlan) {
    const programContext = await prisma.programContext.findUnique({
      where: { programId },
    })

    const contextData = programContext ? {
      profileSummary: programContext.profileSummary,
      planSummary: programContext.planSummary,
      moduleOutlines: JSON.parse(programContext.moduleOutlinesJson || '[]'),
      constraints: JSON.parse(programContext.constraintsJson || '{}'),
      languagePolicy: JSON.parse(programContext.languagePolicyJson || '{}'),
    } : null

    resourcePlan = await generateResourcePlan(lessonBlueprint, moduleBlueprint.title, contextData)
  }

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      buildStatus: 'IN_PROGRESS',
      buildError: null,
      title: lessonBlueprint.title,
      objectivesJson: JSON.stringify(lessonBlueprint.objectives),
      estimatedMinutes: lessonBlueprint.estimatedMinutes,
    },
  })

  await appendBuildEvent(jobId, {
    type: 'lesson.started',
    step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
    status: 'IN_PROGRESS',
    message: `Building lesson: ${lessonBlueprint.title}`,
    payload: {
      moduleId,
      lessonId: lesson.id,
      lessonIndex,
      lessonTitle: lessonBlueprint.title,
    },
  })

  let resources: ResourceCandidate[] = []
  try {
    await appendBuildEvent(jobId, {
      type: 'lesson.gather_context.started',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'IN_PROGRESS',
      message: 'Gathering learning resources',
    })

    const resourceCurator = getResourceCuratorAgent()
    resources = await withHeartbeat(() =>
      resourceCurator.findResources(
        profile.topic,
        lessonBlueprint,
        moduleBlueprint.title,
        profile.learningPreferences,
        languagePolicy
      )
    )

    await appendBuildEvent(jobId, {
      type: 'lesson.gather_context.completed',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'COMPLETED',
      message: `Gathered ${resources.length} resources`,
    })
  } catch (error) {
    await appendBuildEvent(jobId, {
      type: 'lesson.gather_context.failed',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'FAILED',
      level: 'WARN',
      message: error instanceof Error ? error.message : 'Resource curation failed',
    })
    resources = []
  }

  const lessonBuilder = getLessonBuilderAgent()
  const exerciseGenerator = getExerciseGeneratorAgent()

  let notes: LessonNotes
  try {
    await appendBuildEvent(jobId, {
      type: 'lesson.draft.started',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'IN_PROGRESS',
      message: 'Drafting lesson notes and practice content',
    })

    notes = await withHeartbeat(() =>
      lessonBuilder.buildLessonNotes(lessonBlueprint, resources, moduleBlueprint.title, languagePolicy)
    )

    if (violatesTargetLanguage(notes, languagePolicy)) {
      const repairedNotes = await repairLessonNotesLanguage(lessonBlueprint, notes, languagePolicy)
      notes = repairedNotes
    }
  } catch (error) {
    await appendBuildEvent(jobId, {
      type: 'lesson.draft.failed',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'FAILED',
      level: 'WARN',
      message: error instanceof Error ? error.message : 'Lesson draft failed',
    })

    notes = buildFallbackNotes(lessonBlueprint, languagePolicy)
  }

  let exercises: ExerciseSet
  try {
    exercises = await withHeartbeat(() =>
      exerciseGenerator.generateExerciseSet(
        lessonBlueprint,
        'intermediate',
        'mixed',
        [],
        languagePolicy
      )
    )

    if (violatesTargetLanguage(exercises, languagePolicy)) {
      const repairedExerciseSet = await repairExerciseLanguage(
        lessonBlueprint,
        exercises,
        'intermediate',
        'mixed',
        languagePolicy
      )
      exercises = repairedExerciseSet
    }
  } catch (error) {
    await appendBuildEvent(jobId, {
      type: 'lesson.exercises.failed',
      step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
      status: 'FAILED',
      level: 'WARN',
      message: error instanceof Error ? error.message : 'Exercise generation failed',
    })
    exercises = buildFallbackExerciseSet(lessonBlueprint, languagePolicy)
  }

  await appendBuildEvent(jobId, {
    type: 'lesson.review.started',
    step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
    status: 'IN_PROGRESS',
    message: 'Reviewing and refining draft artifacts',
  })

  const refinedNotes = await withHeartbeat(() =>
    reviewAndRefineLessonNotes(lessonBlueprint, notes, languagePolicy)
  )
  const refinedExercises = await withHeartbeat(() =>
    reviewAndRefineExerciseSet(lessonBlueprint, exercises)
  )

  await appendBuildEvent(jobId, {
    type: 'lesson.review.completed',
    step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
    status: 'COMPLETED',
    message: 'Chunk review completed',
  })

  await prisma.$transaction(async (tx) => {
    await tx.resource.deleteMany({ where: { lessonId: lesson.id } })

    for (const resource of resources) {
      await tx.resource.create({
        data: {
          lessonId: lesson.id,
          type: resource.type.toUpperCase() as any,
          title: resource.title,
          url: resource.url,
          durationSeconds: resource.durationSeconds ?? null,
          sourceMetaJson: JSON.stringify({
            channel: resource.channel,
            reason: resource.reason,
            relevanceScore: resource.relevanceScore,
          }),
          qualityScore: resource.qualityScore,
        },
      })
    }

    await tx.lessonNote.upsert({
      where: { lessonId: lesson.id },
      create: {
        lessonId: lesson.id,
        contentMarkdown: refinedNotes.summary,
        glossaryJson: JSON.stringify(refinedNotes.glossary),
      },
      update: {
        contentMarkdown: refinedNotes.summary,
        glossaryJson: JSON.stringify(refinedNotes.glossary),
      },
    })

    await tx.exerciseSet.deleteMany({ where: { lessonId: lesson.id } })
    await tx.exerciseSet.create({
      data: {
        lessonId: lesson.id,
        difficulty: 'INTERMEDIATE',
        type: 'MIXED',
        schemaVersion: '2.0-iterative',
        contentJson: JSON.stringify(refinedExercises),
      },
    })

    await tx.lesson.update({
      where: { id: lesson.id },
      data: {
        buildStatus: 'COMPLETED',
        buildError: null,
      },
    })
  })

  const moduleProgress = await prisma.lesson.count({
    where: {
      moduleId,
      buildStatus: 'COMPLETED',
    },
  })

  await appendBuildEvent(jobId, {
    type: 'lesson.completed',
    step: `Module ${moduleBlueprint.index + 1} / Lesson ${lessonIndex + 1}`,
    status: 'COMPLETED',
    message: `Lesson ready: ${lessonBlueprint.title}`,
    payload: {
      lessonId: lesson.id,
      moduleId,
      moduleProgress,
      summary: refinedNotes.summary,
    },
  })

  // Create lesson context for RAG/context awareness
  await upsertLessonContext(lesson.id, lessonBlueprint, refinedNotes.summary, resourcePlan)
}

async function ensureModuleQuiz(
  jobId: string,
  module: ModuleBlueprint,
  dbModuleId: string,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<void> {
  const job = await getBuildJobOrThrow(jobId)
  const existing = await prisma.assessment.findFirst({
    where: {
      programId: job.programId,
      moduleId: dbModuleId,
      type: 'QUIZ',
    },
  })

  if (existing) return

  try {
    const assessmentAgent = getAssessmentOfficeAgent()
    const quiz = await assessmentAgent.generateQuiz(
      {
        index: 0,
        title: `${module.title} Quiz`,
        description: `Coverage quiz for ${module.title}`,
        objectives: module.outcomes,
        estimatedMinutes: 20,
        keyTopics: module.outcomes,
      },
      10,
      languagePolicy
    )

    const quizPayload = await ensureAssessmentLanguageCompliance(
      {
        ...quiz,
        type: 'quiz',
      },
      {
        index: 0,
        title: `${module.title} Quiz`,
        description: `Coverage quiz for ${module.title}`,
        objectives: module.outcomes,
        estimatedMinutes: 20,
        keyTopics: module.outcomes,
      },
      languagePolicy
    )

    await prisma.assessment.create({
      data: {
        programId: job.programId,
        moduleId: dbModuleId,
        type: 'QUIZ',
        title: quizPayload.title,
        rubricJson: JSON.stringify(quizPayload.rubric ?? null),
        contentJson: JSON.stringify(quizPayload.questions),
      },
    })

    await appendBuildEvent(jobId, {
      type: 'module.quiz.completed',
      step: `Module ${module.index + 1}`,
      status: 'COMPLETED',
      message: `Quiz generated for ${module.title}`,
    })
  } catch (error) {
    await prisma.assessment.create({
      data: {
        programId: job.programId,
        moduleId: dbModuleId,
        type: 'QUIZ',
        title: `${module.title} Quiz (Fallback)`,
        rubricJson: JSON.stringify(null),
        contentJson: JSON.stringify([]),
      },
    })

    await appendBuildEvent(jobId, {
      type: 'module.quiz.failed',
      step: `Module ${module.index + 1}`,
      status: 'FAILED',
      level: 'WARN',
      message: error instanceof Error ? error.message : 'Quiz generation failed, fallback created',
    })
  }
}

async function ensureFinalExam(
  jobId: string,
  blueprint: ProgramBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<void> {
  const job = await getBuildJobOrThrow(jobId)
  const existing = await prisma.assessment.findFirst({
    where: {
      programId: job.programId,
      moduleId: null,
      type: 'EXAM',
      title: 'Final Exam',
    },
  })

  if (existing) return

  const assessmentAgent = getAssessmentOfficeAgent()

  try {
    const finalExam = await assessmentAgent.generateFinalExam(
      blueprint.title,
      blueprint.modules,
      40,
      languagePolicy
    )

    const compliantExam = await ensureAssessmentLanguageCompliance(
      {
        ...finalExam,
        type: 'exam',
      },
      {
        index: 0,
        title: 'Final Exam',
        description: `Program final assessment for ${blueprint.title}`,
        objectives: blueprint.modules.flatMap((module) => module.outcomes).slice(0, 12),
        estimatedMinutes: 90,
        keyTopics: blueprint.modules.map((module) => module.title).slice(0, 10),
      },
      languagePolicy
    )

    await prisma.assessment.create({
      data: {
        programId: job.programId,
        type: 'EXAM',
        title: 'Final Exam',
        rubricJson: JSON.stringify(compliantExam.rubric ?? null),
        contentJson: JSON.stringify(compliantExam.questions),
      },
    })
  } catch (error) {
    await prisma.assessment.create({
      data: {
        programId: job.programId,
        type: 'EXAM',
        title: 'Final Exam (Fallback)',
        rubricJson: JSON.stringify(null),
        contentJson: JSON.stringify([]),
      },
    })

    await appendBuildEvent(jobId, {
      type: 'final_exam.failed',
      step: 'Assessments',
      status: 'FAILED',
      level: 'WARN',
      message: error instanceof Error ? error.message : 'Final exam generation failed, fallback created',
    })
  }
}

async function buildDeterministicSchedule(
  programId: string,
  blueprint: ProgramBlueprint,
  profile: StudentOnboardingProfile
): Promise<void> {
  await prisma.schedule.deleteMany({ where: { programId } })

  const startDate = new Date()
  const endDate = new Date(profile.targetDate)

  const schedule = await prisma.schedule.create({
    data: {
      programId,
      timezone: 'UTC',
      startDate,
      endDate,
    },
  })

  const lessonRows = await prisma.lesson.findMany({
    where: {
      module: {
        programId,
      },
    },
    include: {
      module: true,
    },
    orderBy: [{ module: { index: 'asc' } }, { index: 'asc' }],
  })

  const minutesPerDay = Math.max(60, Math.min(10 * 60, profile.hoursPerDay * 60))
  let dayCursor = new Date(startDate)
  let minuteCursor = 0

  const pushItem = async (input: {
    type: 'LESSON' | 'EXERCISE' | 'QUIZ' | 'TEST' | 'EXAM' | 'REVIEW' | 'BREAK'
    refId?: string
    estimatedMinutes: number
  }) => {
    if (minuteCursor + input.estimatedMinutes > minutesPerDay) {
      dayCursor = addDays(dayCursor, 1)
      minuteCursor = 0
    }

    await prisma.scheduleItem.create({
      data: {
        scheduleId: schedule.id,
        date: new Date(dayCursor),
        type: input.type,
        refId: input.refId ?? null,
        estimatedMinutes: input.estimatedMinutes,
        status: 'PENDING',
      },
    })

    minuteCursor += input.estimatedMinutes
  }

  for (let i = 0; i < lessonRows.length; i++) {
    const lesson = lessonRows[i]
    await pushItem({
      type: 'LESSON',
      refId: lesson.id,
      estimatedMinutes: Math.max(25, Math.min(120, lesson.estimatedMinutes)),
    })

    await pushItem({
      type: 'EXERCISE',
      refId: lesson.id,
      estimatedMinutes: 30,
    })

    if ((i + 1) % 4 === 0) {
      await pushItem({
        type: 'REVIEW',
        estimatedMinutes: 35,
      })
    }
  }

  const moduleRows = await prisma.module.findMany({
    where: { programId },
    orderBy: { index: 'asc' },
  })

  for (const module of moduleRows) {
    const quiz = await prisma.assessment.findFirst({
      where: {
        programId,
        moduleId: module.id,
        type: 'QUIZ',
      },
      orderBy: { createdAt: 'asc' },
    })

    if (quiz) {
      await pushItem({
        type: 'QUIZ',
        refId: quiz.id,
        estimatedMinutes: 30,
      })
    }
  }

  const finalExam = await prisma.assessment.findFirst({
    where: {
      programId,
      type: 'EXAM',
    },
    orderBy: { createdAt: 'asc' },
  })

  if (finalExam) {
    await pushItem({
      type: 'EXAM',
      refId: finalExam.id,
      estimatedMinutes: 90,
    })
  }
}

async function planLessonsForModule(
  profile: StudentOnboardingProfile,
  module: ModuleBlueprint,
  lessonCount: number,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<Array<{ title: string; objectives: string[]; estimatedMinutes?: number }>> {
  const client = getOpenRouterClient()

  try {
    const result = await client.chatCompletionWithSchema<z.infer<typeof ModuleLessonPlanSchema>>(
      {
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              `You are a curriculum planning assistant. Create concise lesson chunks for one module. Return strict JSON only.

${buildLanguageDirective(languagePolicy)}`,
          },
          {
            role: 'user',
            content: `Plan ${lessonCount} lessons for this module.

Topic: ${profile.topic}
Current level: ${profile.currentLevel}
Goal level: ${profile.goalLevel}
Module title: ${module.title}
Module outcomes:\n- ${module.outcomes.join('\n- ')}

Return JSON object with:
{
  "lessons": [
    {
      "title": "string",
      "objectives": ["string"],
      "estimatedMinutes": 45
    }
  ]
}

Rules:
- exactly ${lessonCount} lessons
- objectives per lesson: 2-4 bullet items
- realistic titles, no generic numbering-only titles`,
          },
        ],
      },
      ModuleLessonPlanSchema
    )

    return result.lessons.slice(0, lessonCount)
  } catch {
    return Array.from({ length: lessonCount }).map((_, index) => ({
      title: `${module.title} — Lesson ${index + 1}`,
      objectives: module.outcomes.slice(0, 3),
      estimatedMinutes: 45,
    }))
  }
}

async function reviewAndRefineLessonNotes(
  lesson: LessonBlueprint,
  notes: LessonNotes,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<LessonNotes> {
  const client = getOpenRouterClient()

  try {
    const refined = await client.chatCompletionWithSchema<LessonNotes>(
      {
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              `You are a lesson QA reviewer. Refine lesson notes for clarity and coverage while preserving schema. Return JSON only.

${buildLanguageDirective(languagePolicy)}`,
          },
          {
            role: 'user',
            content: `Refine this lesson notes chunk.

Lesson: ${lesson.title}
Objectives:\n- ${lesson.objectives.join('\n- ')}

Current notes JSON:
${JSON.stringify(notes)}`,
          },
        ],
      },
      LessonNotesSchema,
      2
    )

    return LessonNotesSchema.parse(refined)
  } catch {
    return notes
  }
}

async function reviewAndRefineExerciseSet(
  lesson: LessonBlueprint,
  exerciseSet: ExerciseSet
): Promise<ExerciseSet> {
  // NOTE:
  // Free models frequently degrade schema fidelity during a second-pass refinement.
  // Keep the original validated set to avoid introducing malformed content.
  return ExerciseSetSchema.parse(exerciseSet)
}

function normalizeBlueprint(blueprint: ProgramBlueprint): ProgramBlueprint {
  const modules = blueprint.modules.slice(0, MAX_MODULES).map((module, moduleIndex) => ({
    ...module,
    index: moduleIndex,
    lessonsCount: Math.max(1, Math.min(module.lessonsCount, MAX_LESSONS_PER_MODULE)),
    outcomes: module.outcomes.slice(0, 6),
  }))

  const totalLessons = modules.reduce((acc, module) => acc + module.lessonsCount, 0)

  return {
    ...blueprint,
    modules,
    totalLessons,
    totalHours: modules.reduce((acc, module) => acc + module.estimatedHours, 0),
  }
}

function buildFallbackNotes(
  lesson: LessonBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): LessonNotes {
  const wrap = (text: string) =>
    languagePolicy.contentLanguage.toLowerCase() === 'english'
      ? text
      : `[${languagePolicy.contentLanguage}] ${text}`

  return {
    summary: wrap(`This lesson covers ${lesson.title}. Use the objectives below to guide study and revision.`),
    keyPoints: lesson.objectives.slice(0, 5).map(wrap),
    glossary: lesson.objectives.slice(0, 3).map((objective) => ({
      term: objective.split(' ').slice(0, 3).join(' '),
      definition: wrap(objective),
    })),
    guidedNotes: [
      {
        section: wrap('Core Objectives'),
        content: wrap(lesson.objectives.join('; ')),
        questions: [
          wrap('What concept in this lesson feels hardest?'),
          wrap('How will you practice this objective today?'),
        ],
      },
    ],
    additionalResources: [],
  }
}

function buildFallbackExerciseSet(
  lesson: LessonBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): ExerciseSet {
  const wrap = (text: string) =>
    languagePolicy.contentLanguage.toLowerCase() === 'english'
      ? text
      : `[${languagePolicy.contentLanguage}] ${text}`

  return {
    title: wrap(`${lesson.title} Practice Set`),
    description: wrap('Fallback practice set generated after exercise pipeline error.'),
    difficulty: 'intermediate',
    type: 'mixed',
    estimatedMinutes: 20,
    questions: [],
    instructions: wrap('Regenerate this practice set from the Practice Lab for expanded questions.'),
  }
}

async function ensureBlueprintLanguagePolicy(
  profile: StudentOnboardingProfile,
  blueprint: ProgramBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<ProgramBlueprint> {
  if (!violatesTargetLanguage(blueprint, languagePolicy)) {
    return blueprint
  }

  const curriculumAgent = getCurriculumArchitectAgent()
  return curriculumAgent.generateProgram(profile, languagePolicy)
}

async function repairLessonNotesLanguage(
  lesson: LessonBlueprint,
  notes: LessonNotes,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<LessonNotes> {
  const client = getOpenRouterClient()

  try {
    const repaired = await client.chatCompletionWithSchema<LessonNotes>(
      {
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `You repair lesson notes language compliance while preserving meaning and structure.

${buildLanguageDirective(languagePolicy)}`,
          },
          {
            role: 'user',
            content: `Rewrite this lesson notes payload to fully comply with language policy.

Lesson: ${lesson.title}
Objectives:\n- ${lesson.objectives.join('\n- ')}

JSON:
${JSON.stringify(notes)}`,
          },
        ],
      },
      LessonNotesSchema,
      2
    )

    return LessonNotesSchema.parse(repaired)
  } catch {
    return notes
  }
}

async function repairExerciseLanguage(
  lesson: LessonBlueprint,
  exerciseSet: ExerciseSet,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  type: 'mixed' | 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'vocabulary',
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
): Promise<ExerciseSet> {
  const exerciseAgent = getExerciseGeneratorAgent()

  try {
    const regenerated = await exerciseAgent.generateExerciseSet(
      lesson,
      difficulty,
      type,
      [],
      languagePolicy
    )

    if (!violatesTargetLanguage(regenerated, languagePolicy)) {
      return regenerated
    }
  } catch {
    // Ignore and keep original set
  }

  return exerciseSet
}

async function ensureAssessmentLanguageCompliance(
  assessment: {
    type: 'quiz' | 'test' | 'exam'
    title: string
    description: string
    timeLimitMinutes?: number
    questions: ExerciseQuestion[]
    rubric?: any
    passingScore: number
    instructions?: string
  },
  lessonLike: LessonBlueprint,
  languagePolicy: ReturnType<typeof resolveLanguagePolicy>
) {
  if (!violatesTargetLanguage(assessment, languagePolicy)) {
    return assessment
  }

  const assessmentOffice = getAssessmentOfficeAgent()
  if (assessment.type === 'quiz') {
    return assessmentOffice.generateQuiz(lessonLike, assessment.questions.length || 10, languagePolicy)
  }

  return assessment
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function safeParseJson<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T
  } catch {
    return null
  }
}
