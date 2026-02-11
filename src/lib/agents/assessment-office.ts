/**
 * Assessment Office Agent
 * Creates quizzes, tests, and exams with rubrics
 */

import { getParallelAIClient } from '../ai/parallel-client'
import {
  AssessmentSchema,
  RubricSchema,
  type Assessment,
  type LessonBlueprint,
  type ModuleBlueprint,
  type Rubric,
} from '../schemas'
import { buildLanguageDirective, resolveLanguagePolicy, type LanguagePolicy } from '../language'

class AssessmentOfficeAgent {
  private client = getParallelAIClient()

  private assessmentSchemaHint(type: 'quiz' | 'test' | 'exam', questionCount: number): string {
    return `Return ONLY a valid JSON object.

Required top-level fields:
- type: "${type}"
- title: string
- description: string
- timeLimitMinutes?: number
- questions: array (exactly ${questionCount} items)
- passingScore: number
- instructions?: string
- rubric?: { criteria: [{ name, description, maxPoints, levels: [{ score, description }] }], totalPoints, passingScore }

Allowed question types ONLY:
- mcq
- true_false
- matching
- cloze
- short_answer

Question requirements:
- Every question MUST include: explanation, difficulty
- difficulty must be one of: beginner | intermediate | advanced
- mcq must include: question, options (>=2), correctAnswer (number index)
- true_false must include: question, correctAnswer (boolean)
- matching must include: question, pairs [{ left, right }]
- cloze must include: question, blanks [{ index, answer, alternatives? }]
- short_answer must include: question, expectedAnswer, keywords

Critical constraints:
- Do NOT output schema metadata such as _def, typeName, ~standard.
- Do NOT wrap JSON in markdown.
- Output JSON only.`
  }

  /**
   * Generate a quiz for a lesson
   */
  async generateQuiz(
    lesson: LessonBlueprint,
    questionCount: number = 10,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<Assessment> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert assessment designer at a prestigious educational institution. Create valid, high-quality, auto-gradable assessments.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Generate a lesson quiz.

Lesson: ${lesson.title}
Description: ${lesson.description}
Objectives:\n- ${lesson.objectives.join('\n- ')}
Key Topics: ${lesson.keyTopics.join(', ')}

${this.assessmentSchemaHint('quiz', questionCount)}

Additional rules:
- Keep difficulty balanced around lesson objectives.
- Passing score should be 70.
- Prefer concrete, unambiguous wording.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<Assessment>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.5,
        priority: 'reasoning',
      },
      AssessmentSchema,
      2
    )

    return AssessmentSchema.parse(response)
  }

  /**
   * Generate a test for a module
   */
  async generateTest(
    module: ModuleBlueprint,
    lessons: LessonBlueprint[],
    questionCount: number = 20,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<Assessment> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const lessonSummaries = lessons.map((l) => `- ${l.title}: ${l.description}`).join('\n')

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert assessment designer. Create comprehensive module tests that measure learning outcomes.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Generate a module test.

Module: ${module.title}
Description: ${module.description}
Outcomes:\n- ${module.outcomes.join('\n- ')}

Lessons in this module:
${lessonSummaries}

${this.assessmentSchemaHint('test', questionCount)}

Additional rules:
- Cover all major outcomes.
- Passing score should be 70.
- Time limit should be realistic for the number of questions (typically 45-60 minutes).`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<Assessment>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.5,
        priority: 'reasoning',
      },
      AssessmentSchema,
      2
    )

    return AssessmentSchema.parse(response)
  }

  /**
   * Generate a final exam
   */
  async generateFinalExam(
    programTitle: string,
    modules: ModuleBlueprint[],
    questionCount: number = 40,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<Assessment> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const moduleSummaries = modules.map((m) => `- ${m.title}: ${m.description}`).join('\n')

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert assessment designer. Create comprehensive final exams that measure program-level mastery.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Generate a final exam.

Program: ${programTitle}
Modules covered:
${moduleSummaries}

${this.assessmentSchemaHint('exam', questionCount)}

Additional rules:
- Ensure broad coverage across modules.
- Include some synthesis/application questions.
- Passing score should be 70.
- Time limit should usually be 90-120 minutes.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<Assessment>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.5,
        priority: 'reasoning',
      },
      AssessmentSchema,
      2
    )

    return AssessmentSchema.parse(response)
  }

  /**
   * Generate a rubric for subjective assessments
   */
  async generateRubric(
    assessmentType: 'speaking' | 'writing',
    topic: string,
    objectives: string[],
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<Rubric> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert assessment designer. Create clear, fair rubrics for subjective assessments and return strict JSON.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Create a ${assessmentType} rubric.

Topic: ${topic}
Objectives:\n- ${objectives.join('\n- ')}

Return ONLY JSON object with:
- criteria: array of 4-6 items
  - name: string
  - description: string
  - maxPoints: number
  - levels: exactly 4 levels [{ score, description }]
- totalPoints: number
- passingScore: number

Do not output markdown or schema metadata.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<Rubric>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.4,
        priority: 'reasoning',
      },
      RubricSchema,
      2
    )

    return RubricSchema.parse(response)
  }

  /**
   * Generate a midterm exam
   */
  async generateMidtermExam(
    programTitle: string,
    modules: ModuleBlueprint[],
    questionCount: number = 30,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<Assessment> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const moduleSummaries = modules.map((m) => `- ${m.title}: ${m.description}`).join('\n')

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert assessment designer. Create robust midterm exams that validate progress so far.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Generate a midterm exam.

Program: ${programTitle}
Modules covered so far:
${moduleSummaries}

${this.assessmentSchemaHint('exam', questionCount)}

Additional rules:
- Focus on already-covered modules.
- Passing score should be 70.
- Time limit should usually be 60-90 minutes.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<Assessment>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.5,
        priority: 'reasoning',
      },
      AssessmentSchema,
      2
    )

    return AssessmentSchema.parse(response)
  }
}

// Singleton instance
let agentInstance: AssessmentOfficeAgent | null = null

export function getAssessmentOfficeAgent(): AssessmentOfficeAgent {
  if (!agentInstance) {
    agentInstance = new AssessmentOfficeAgent()
  }
  return agentInstance
}
