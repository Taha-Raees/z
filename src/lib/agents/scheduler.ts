/**
 * Scheduler Agent
 * Creates daily and weekly schedules based on program and availability
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { DailyPlanSchema, type DailyPlan, type ProgramBlueprint, type ModuleBlueprint, type LessonBlueprint } from '../schemas'

class SchedulerAgent {
  private client = getParallelAIClient()

  /**
   * Generate a complete schedule for a program
   */
  async generateProgramSchedule(
    program: ProgramBlueprint,
    hoursPerDay: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.ceil(totalDays / 7)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert academic scheduler at a prestigious educational institution. Your task is to create realistic, balanced schedules that help students succeed.

Scheduling principles:
1. Balance different types of activities (lessons, exercises, assessments, review)
2. Include regular breaks to prevent burnout
3. Schedule assessments at appropriate intervals
4. Account for different learning paces
5. Ensure time estimates are realistic
6. Include buffer time for unexpected delays`,
      },
      {
        role: 'user' as const,
        content: `Create a schedule for this learning program:

Program: ${program.title}
Total Modules: ${program.modules.length}
Total Lessons: ${program.totalLessons}
Total Hours: ${program.totalHours}
Estimated Weeks: ${program.estimatedWeeks}

Student Availability:
- Hours per day: ${hoursPerDay}
- Start date: ${startDate.toISOString().split('T')[0]}
- End date: ${endDate.toISOString().split('T')[0]}
- Total days available: ${totalDays}

Create a weekly schedule structure that:
1. Distributes lessons evenly across the timeline
2. Includes regular practice sessions
3. Schedules quizzes after each module
4. Includes a midterm exam at the halfway point
5. Includes a final exam at the end
6. Has review sessions before assessments
7. Includes rest days (1-2 per week)

Return as JSON with structure:
{
  weeklyStructure: [
    {
      week: number,
      days: [
        {
          dayOfWeek: string,
          activities: [
            {
              type: 'lesson' | 'exercise' | 'quiz' | 'test' | 'exam' | 'review' | 'break',
              title: string,
              estimatedMinutes: number,
              moduleIndex: number,
              lessonIndex: number
            }
          ]
        }
      ]
    }
  ],
  milestones: [
    {
      week: number,
      title: string,
      description: string
    }
  ]
}`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'standard',
    })

    const content = response.selectedResult.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    return JSON.parse(content)
  }

  /**
   * Generate a daily plan for a specific date
   */
  async generateDailyPlan(
    date: Date,
    program: ProgramBlueprint,
    completedLessons: string[],
    weakTopics: string[] = [],
    hoursAvailable: number = 2
  ): Promise<DailyPlan> {
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert academic advisor. Create effective daily plans that help students make progress while avoiding overwhelm.`,
      },
      {
        role: 'user' as const,
        content: `Create a daily plan for:

Date: ${dateStr} (${dayOfWeek})
Available Time: ${hoursAvailable} hours

Program: ${program.title}
Completed Lessons: ${completedLessons.length} of ${program.totalLessons}
Weak Areas: ${weakTopics.join(', ') || 'None'}

Create a plan that:
1. Focuses on the next incomplete lesson
2. Includes practice exercises
3. Adds review time for weak areas if identified
4. Is realistic for the available time
5. Includes a mix of activities to maintain engagement

Return as JSON following this schema:
${JSON.stringify(DailyPlanSchema.shape, null, 2)}`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<DailyPlan>(
      {
        messages,
        temperature: 0.7,
        priority: 'standard',
      },
      DailyPlanSchema
    )

    return DailyPlanSchema.parse(response)
  }

  /**
   * Adjust schedule based on progress
   */
  async adjustSchedule(
    currentSchedule: any,
    progressData: any,
    daysRemaining: number
  ): Promise<any> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert academic scheduler. Adjust schedules based on actual student progress.',
      },
      {
        role: 'user' as const,
        content: `Adjust this schedule based on progress:

Current Schedule:
${JSON.stringify(currentSchedule, null, 2)}

Progress Data:
${JSON.stringify(progressData, null, 2)}

Days Remaining: ${daysRemaining}

Adjustments needed:
1. If behind schedule: compress remaining activities or extend timeline
2. If ahead of schedule: add more practice or review
3. If struggling with specific topics: add more review time
4. Maintain balance of activities

Return adjusted schedule in same format.`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'standard',
    })

    const content = response.selectedResult.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    return JSON.parse(content)
  }

  /**
   * Generate a weekly plan
   */
  async generateWeeklyPlan(
    weekNumber: number,
    program: ProgramBlueprint,
    hoursPerDay: number
  ): Promise<any> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert academic scheduler. Create balanced weekly plans.',
      },
      {
        role: 'user' as const,
        content: `Create a weekly plan for week ${weekNumber}:

Program: ${program.title}
Hours per day: ${hoursPerDay}

Create a 7-day plan that:
1. Includes 5-6 learning days
2. Has 1-2 rest days
3. Balances lessons, exercises, and review
4. Includes time for assessments if scheduled
5. Is realistic and achievable

Return as JSON with structure:
{
  week: number,
  days: [
    {
      dayOfWeek: string,
      date: string (ISO format),
      activities: [
        {
          type: 'lesson' | 'exercise' | 'quiz' | 'test' | 'exam' | 'review' | 'break',
          title: string,
          estimatedMinutes: number,
          priority: 'high' | 'medium' | 'low'
        }
      ],
      totalMinutes: number
    }
  ],
  totalMinutes: number,
  notes: string
}`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'standard',
    })

    const content = response.selectedResult.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    return JSON.parse(content)
  }

  /**
   * Estimate time for activities
   */
  estimateActivityTime(
    activityType: 'lesson' | 'exercise' | 'quiz' | 'test' | 'exam' | 'review',
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): number {
    const baseTimes = {
      lesson: 45,
      exercise: 30,
      quiz: 20,
      test: 45,
      exam: 90,
      review: 30,
    }

    const difficultyMultipliers = {
      beginner: 1.2,
      intermediate: 1.0,
      advanced: 0.8,
    }

    return Math.round(baseTimes[activityType] * difficultyMultipliers[difficulty])
  }
}

// Singleton instance
let agentInstance: SchedulerAgent | null = null

export function getSchedulerAgent(): SchedulerAgent {
  if (!agentInstance) {
    agentInstance = new SchedulerAgent()
  }
  return agentInstance
}
