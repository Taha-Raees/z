/**
 * Workflow Orchestrator
 * Coordinates multiple agents to complete complex workflows
 */

import { prisma } from '../prisma'
import { getAdmissionsOfficerAgent } from '../agents/admissions-officer'
import { getCurriculumArchitectAgent } from '../agents/curriculum-architect'
import { getResourceCuratorAgent } from '../agents/resource-curator'
import { getLessonBuilderAgent } from '../agents/lesson-builder'
import { getExerciseGeneratorAgent } from '../agents/exercise-generator'
import { getAssessmentOfficeAgent } from '../agents/assessment-office'
import { getSchedulerAgent } from '../agents/scheduler'
import type { StudentOnboardingProfile, ProgramBlueprint, ModuleBlueprint, LessonBlueprint } from '../schemas'

export interface WorkflowProgress {
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message?: string
  timestamp: Date
}

export interface WorkflowResult {
  success: boolean
  programId?: string
  progress: WorkflowProgress[]
  error?: string
}

export interface GenerateProgramOptions {
  onProgress?: (update: WorkflowProgress) => void | Promise<void>
}

class WorkflowOrchestrator {
  /**
   * Complete program generation workflow
   */
  async generateProgram(
    userId: string,
    profile: StudentOnboardingProfile,
    options: GenerateProgramOptions = {}
  ): Promise<WorkflowResult> {
    const progress: WorkflowProgress[] = []
    const addProgress = async (
      step: string,
      status: WorkflowProgress['status'],
      message?: string
    ) => {
      const update: WorkflowProgress = { step, status, message, timestamp: new Date() }
      progress.push(update)

      if (options.onProgress) {
        await options.onProgress(update)
      }
    }

    try {
      // Step 1: Generate program blueprint
      await addProgress('Generating program structure', 'in_progress')
      const curriculumAgent = getCurriculumArchitectAgent()
      const programBlueprint = await curriculumAgent.generateProgram(profile)
      
      // Validate program
      const validation = await curriculumAgent.validateProgram(profile, programBlueprint)
      if (!validation.valid) {
        // Adjust program if needed
        await addProgress('Validating and adjusting program', 'in_progress', validation.issues.join('; '))
        const adjustedProgram = await curriculumAgent.adjustProgram(profile, programBlueprint, validation)
        Object.assign(programBlueprint, adjustedProgram)
      }
      await addProgress('Generating program structure', 'completed')

      // Step 2: Create program in database
      await addProgress('Creating program record', 'in_progress')
      const program = await prisma.program.create({
        data: {
          userId,
          topic: profile.topic,
          goal: profile.goalLevel,
          targetDate: new Date(profile.targetDate),
          hoursPerDay: profile.hoursPerDay,
          currentLevel: profile.currentLevel,
          status: 'DRAFT',
          version: 1,
        },
      })
      await addProgress('Creating program record', 'completed')

      // Step 3: Create modules
      await addProgress('Creating modules', 'in_progress')
      const createdModules: any[] = []
      for (const moduleData of programBlueprint.modules) {
        const module = await prisma.module.create({
          data: {
            programId: program.id,
            index: moduleData.index,
            title: moduleData.title,
            outcomesJson: JSON.stringify(moduleData.outcomes),
          },
        })
        createdModules.push({ ...moduleData, dbId: module.id })
      }
      await addProgress('Creating modules', 'completed')

      // Step 4: Create lessons and resources
      await addProgress('Creating lessons and resources', 'in_progress')
      const resourceCurator = getResourceCuratorAgent()
      const lessonBuilder = getLessonBuilderAgent()

      for (const module of createdModules) {
        for (let i = 0; i < module.lessonsCount; i++) {
          // Generate lesson blueprint
          const lessonBlueprint: LessonBlueprint = {
            index: i,
            title: `Lesson ${i + 1}`,
            description: `Lesson ${i + 1} for ${module.title}`,
            objectives: module.outcomes.slice(0, 3),
            estimatedMinutes: 45,
            keyTopics: module.outcomes.slice(0, 3),
          }

          // Create lesson
          const lesson = await prisma.lesson.create({
            data: {
              moduleId: module.dbId,
              index: i,
              title: lessonBlueprint.title,
              objectivesJson: JSON.stringify(lessonBlueprint.objectives),
              estimatedMinutes: lessonBlueprint.estimatedMinutes,
            },
          })

          // Find resources
          const resources = await resourceCurator.findResources(
            profile.topic,
            lessonBlueprint,
            module.title,
            profile.learningPreferences
          )

          // Create resources
          for (const resource of resources) {
            await prisma.resource.create({
              data: {
                lessonId: lesson.id,
                type: resource.type.toUpperCase() as any,
                title: resource.title,
                url: resource.url,
                durationSeconds: resource.durationSeconds,
                sourceMetaJson: JSON.stringify({ channel: resource.channel }),
                qualityScore: resource.qualityScore,
              },
            })
          }

          // Build lesson notes
          const notes = await lessonBuilder.buildLessonNotes(
            lessonBlueprint,
            resources,
            module.title
          )

          await prisma.lessonNote.create({
            data: {
              lessonId: lesson.id,
              contentMarkdown: notes.summary,
              glossaryJson: JSON.stringify(notes.glossary),
            },
          })

          // Generate exercises (non-blocking fallback)
          try {
            const exerciseAgent = getExerciseGeneratorAgent()
            const exerciseSet = await exerciseAgent.generateExerciseSet(
              lessonBlueprint,
              'intermediate',
              'mixed'
            )

            await prisma.exerciseSet.create({
              data: {
                lessonId: lesson.id,
                difficulty: 'INTERMEDIATE',
                type: 'MIXED',
                schemaVersion: '1.0',
                contentJson: JSON.stringify(exerciseSet),
              },
            })
          } catch (error) {
            console.warn(
              `Exercise generation failed for lesson ${lesson.id}. Using fallback empty set.`,
              error
            )

            await prisma.exerciseSet.create({
              data: {
                lessonId: lesson.id,
                difficulty: 'INTERMEDIATE',
                type: 'MIXED',
                schemaVersion: '1.0-fallback',
                contentJson: JSON.stringify({
                  title: `${lessonBlueprint.title} Practice Set`,
                  description: 'Fallback placeholder exercise set generated due to AI validation failure.',
                  difficulty: 'intermediate',
                  type: 'mixed',
                  estimatedMinutes: 30,
                  questions: [],
                  instructions: 'Regenerate this set from Practice Lab to get a full AI-generated version.',
                }),
              },
            })
          }
        }
      }
      await addProgress('Creating lessons and resources', 'completed')

      // Step 5: Generate assessments
      await addProgress('Generating assessments', 'in_progress')
      const assessmentAgent = getAssessmentOfficeAgent()

      // Generate quizzes for each module (non-blocking fallback)
      for (const module of createdModules) {
        try {
          const quiz = await assessmentAgent.generateQuiz(
            {
              index: 0,
              title: `${module.title} Quiz`,
              description: `Quiz for ${module.title}`,
              objectives: module.outcomes,
              estimatedMinutes: 30,
              keyTopics: module.outcomes,
            },
            10
          )

          await prisma.assessment.create({
            data: {
              programId: program.id,
              moduleId: module.dbId,
              type: 'QUIZ',
              title: quiz.title,
              rubricJson: JSON.stringify(quiz.rubric),
              contentJson: JSON.stringify(quiz.questions),
            },
          })
        } catch (error) {
          console.warn(
            `Quiz generation failed for module ${module.dbId}. Using fallback empty quiz.`,
            error
          )

          await prisma.assessment.create({
            data: {
              programId: program.id,
              moduleId: module.dbId,
              type: 'QUIZ',
              title: `${module.title} Quiz (Fallback)`,
              rubricJson: JSON.stringify(null),
              contentJson: JSON.stringify([]),
            },
          })
        }
      }

      // Generate final exam (non-blocking fallback)
      try {
        const finalExam = await assessmentAgent.generateFinalExam(
          programBlueprint.title,
          programBlueprint.modules.map(m => ({
            index: m.index,
            title: m.title,
            description: m.description,
            outcomes: m.outcomes,
            estimatedHours: m.estimatedHours,
            lessonsCount: m.lessonsCount,
          })),
          40
        )

        await prisma.assessment.create({
          data: {
            programId: program.id,
            type: 'EXAM',
            title: 'Final Exam',
            rubricJson: JSON.stringify(finalExam.rubric),
            contentJson: JSON.stringify(finalExam.questions),
          },
        })
      } catch (error) {
        console.warn('Final exam generation failed. Using fallback empty final exam.', error)

        await prisma.assessment.create({
          data: {
            programId: program.id,
            type: 'EXAM',
            title: 'Final Exam (Fallback)',
            rubricJson: JSON.stringify(null),
            contentJson: JSON.stringify([]),
          },
        })
      }
      await addProgress('Generating assessments', 'completed')

      // Step 6: Generate schedule
      await addProgress('Generating schedule', 'in_progress')
      const schedulerAgent = getSchedulerAgent()
      const schedule = await schedulerAgent.generateProgramSchedule(
        programBlueprint,
        profile.hoursPerDay,
        new Date(),
        new Date(profile.targetDate)
      )

      const dbSchedule = await prisma.schedule.create({
        data: {
          programId: program.id,
          timezone: 'UTC',
          startDate: new Date(),
          endDate: new Date(profile.targetDate),
        },
      })

      // Create schedule items
      for (const week of schedule.weeklyStructure) {
        for (const day of week.days) {
          for (const activity of day.activities) {
            await prisma.scheduleItem.create({
              data: {
                scheduleId: dbSchedule.id,
                date: new Date(day.date),
                type: activity.type.toUpperCase() as any,
                refId: `${activity.moduleIndex}-${activity.lessonIndex}`,
                estimatedMinutes: activity.estimatedMinutes,
                status: 'PENDING',
              },
            })
          }
        }
      }
      await addProgress('Generating schedule', 'completed')

      // Step 7: Update program status
      await addProgress('Finalizing program', 'in_progress')
      await prisma.program.update({
        where: { id: program.id },
        data: { status: 'ACTIVE' },
      })
      await addProgress('Finalizing program', 'completed')

      return {
        success: true,
        programId: program.id,
        progress,
      }
    } catch (error) {
      await addProgress('Error', 'failed', error instanceof Error ? error.message : 'Unknown error')
      return {
        success: false,
        progress,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get workflow progress for a program
   */
  async getWorkflowProgress(programId: string): Promise<WorkflowProgress[]> {
    const agentRuns = await prisma.agentRun.findMany({
      where: { programId },
      orderBy: { startedAt: 'asc' },
    })

    return agentRuns.map(run => ({
      step: run.agentName,
      status: run.status.toLowerCase() as WorkflowProgress['status'],
      message: run.outputJson ? JSON.parse(run.outputJson).message : undefined,
      timestamp: run.startedAt,
    }))
  }
}

// Singleton instance
let orchestratorInstance: WorkflowOrchestrator | null = null

export function getWorkflowOrchestrator(): WorkflowOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new WorkflowOrchestrator()
  }
  return orchestratorInstance
}
