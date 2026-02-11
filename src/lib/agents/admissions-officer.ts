/**
 * Admissions Officer Agent
 * Collects required onboarding fields from students
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { StudentOnboardingProfileSchema, type StudentOnboardingProfile } from '../schemas'

export interface OnboardingQuestion {
  questionKey: string
  question: string
  rationale?: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  options?: string[]
  required: boolean
}

export interface OnboardingState {
  answers: Record<string, any>
  completedQuestions: string[]
  currentQuestion: OnboardingQuestion | null
  isComplete: boolean
}

const REQUIRED_FIELDS = [
  'topic',
  'contentLanguage',
  'currentLevel',
  'goalLevel',
  'targetDate',
  'hoursPerDay',
  'pacePreference',
] as const

const OPTIONAL_FIELDS = [
  'instructionLanguage',
  'strictTargetLanguage',
  'learningPreferences',
  'constraints',
  'additionalNotes',
] as const

class AdmissionsOfficerAgent {
  private client = getParallelAIClient()

  private toBoolean(value: unknown, fallback: boolean = false): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', 'yes', 'y', '1', 'strict'].includes(normalized)) return true
      if (['false', 'no', 'n', '0'].includes(normalized)) return false
    }
    return fallback
  }

  private toBoundedNumber(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
  }

  /**
   * Get the next question to ask based on current state
   */
  async getNextQuestion(state: OnboardingState): Promise<OnboardingQuestion | null> {
    // Check if all required fields are complete
    const missingRequired = REQUIRED_FIELDS.filter(
      field => !state.completedQuestions.includes(field)
    )

    if (missingRequired.length === 0) {
      // All required fields complete, check if we should ask optional questions
      const missingOptional = OPTIONAL_FIELDS.filter(
        field => !state.completedQuestions.includes(field)
      )

      if (missingOptional.length > 0) {
        // Ask first optional question
        return this.getQuestionForField(missingOptional[0])
      }

      // All questions complete
      return null
    }

    // Ask first missing required question
    return this.getQuestionForField(missingRequired[0])
  }

  /**
   * Get question definition for a specific field
   */
  private getQuestionForField(field: string): OnboardingQuestion {
    const questions: Record<string, OnboardingQuestion> = {
      topic: {
        questionKey: 'topic',
        question: 'What subject or topic would you like to learn?',
        rationale: 'This helps us design a curriculum tailored to your interests.',
        type: 'text',
        required: true,
      },
      contentLanguage: {
        questionKey: 'contentLanguage',
        question:
          'Which language should learner content use? (questions, passages, prompts, answers, feedback)',
        rationale:
          'We enforce this language in lesson content, exercises, and assessments for consistent immersion.',
        type: 'text',
        required: true,
      },
      currentLevel: {
        questionKey: 'currentLevel',
        question: 'What is your current level in this subject?',
        rationale: 'Understanding your starting point helps us create an appropriate learning path.',
        type: 'select',
        options: ['Complete Beginner', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'],
        required: true,
      },
      goalLevel: {
        questionKey: 'goalLevel',
        question: 'What is your target level?',
        rationale: 'Your goal determines the depth and breadth of the curriculum.',
        type: 'select',
        options: ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert', 'Mastery'],
        required: true,
      },
      targetDate: {
        questionKey: 'targetDate',
        question: 'By when would you like to achieve your goal? (Please provide a date)',
        rationale: 'This helps us create a realistic timeline and pace.',
        type: 'text',
        required: true,
      },
      hoursPerDay: {
        questionKey: 'hoursPerDay',
        question: 'How many hours per day can you dedicate to learning?',
        rationale: 'Your available time determines the intensity of the program.',
        type: 'select',
        options: ['Less than 1 hour', '1-2 hours', '2-3 hours', '3-4 hours', '4+ hours'],
        required: true,
      },
      pacePreference: {
        questionKey: 'pacePreference',
        question: 'What learning pace do you prefer?',
        rationale: 'This helps us balance challenge and comfort in your learning journey.',
        type: 'select',
        options: ['Intensive (fast-paced, challenging)', 'Normal (balanced pace)', 'Light (relaxed, thorough)'],
        required: true,
      },
      instructionLanguage: {
        questionKey: 'instructionLanguage',
        question: 'Which language should platform instructions and UI helper text use?',
        rationale:
          'This controls system-facing text only. Learner content language is controlled separately.',
        type: 'select',
        options: ['English', 'Same as learner content language'],
        required: false,
      },
      strictTargetLanguage: {
        questionKey: 'strictTargetLanguage',
        question: 'Should learner content stay strictly in your target content language?',
        rationale:
          'Strict mode avoids mixed-language exercises and keeps all learner-facing artifacts in one language.',
        type: 'select',
        options: ['Yes, strict target-language mode', 'No, allow mixed-language support when needed'],
        required: false,
      },
      learningPreferences: {
        questionKey: 'learningPreferences',
        question: 'Do you have any preferences for how you learn? (e.g., more videos, more reading, focus on speaking/writing)',
        rationale: 'We can customize the content format based on your preferences.',
        type: 'text',
        required: false,
      },
      constraints: {
        questionKey: 'constraints',
        question: 'Are there any constraints we should know about? (e.g., device limitations, accessibility needs, specific exam format)',
        rationale: 'This helps us ensure the program works for your specific situation.',
        type: 'text',
        required: false,
      },
      additionalNotes: {
        questionKey: 'additionalNotes',
        question: 'Is there anything else you\'d like to share about your learning goals or preferences?',
        rationale: 'Additional context helps us create a more personalized experience.',
        type: 'text',
        required: false,
      },
    }

    return questions[field] || {
      questionKey: field,
      question: `Please provide information about ${field}`,
      type: 'text',
      required: false,
    }
  }

  /**
   * Process an answer and update state
   */
  async processAnswer(
    state: OnboardingState,
    questionKey: string,
    answer: any
  ): Promise<OnboardingState> {
    const newState = { ...state }
    newState.answers[questionKey] = answer

    if (!newState.completedQuestions.includes(questionKey)) {
      newState.completedQuestions.push(questionKey)
    }

    // Get next question
    newState.currentQuestion = await this.getNextQuestion(newState)
    newState.isComplete = newState.currentQuestion === null

    return newState
  }

  /**
   * Generate the final student profile from collected answers
   */
  async generateProfile(state: OnboardingState): Promise<StudentOnboardingProfile> {
    const answers = state.answers

    // Parse hours per day
    let hoursPerDay = 2
    if (typeof answers.hoursPerDay === 'string') {
      const match = answers.hoursPerDay.match(/(\d+)/)
      if (match) {
        hoursPerDay = parseInt(match[1], 10)
      }
    } else if (typeof answers.hoursPerDay === 'number') {
      hoursPerDay = answers.hoursPerDay
    }

    // Calculate hours per week
    const hoursPerWeek = hoursPerDay * 7

    // Parse pace preference
    let pacePreference: 'intensive' | 'normal' | 'light' = 'normal'
    if (typeof answers.pacePreference === 'string') {
      const paceLower = answers.pacePreference.toLowerCase()
      if (paceLower.includes('intensive') || paceLower.includes('fast')) {
        pacePreference = 'intensive'
      } else if (paceLower.includes('light') || paceLower.includes('relaxed')) {
        pacePreference = 'light'
      } else {
        pacePreference = 'normal'
      }
    }

    // Parse learning preferences
    const learningPreferences = {
      videoPreference: 50,
      readingPreference: 50,
      speakingFocus: false,
      writingFocus: false,
      listeningFocus: false,
    }

    if (typeof answers.learningPreferences === 'string') {
      const prefs = answers.learningPreferences.toLowerCase()
      if (prefs.includes('video')) learningPreferences.videoPreference = 70
      if (prefs.includes('reading')) learningPreferences.readingPreference = 70
      if (prefs.includes('speaking')) learningPreferences.speakingFocus = true
      if (prefs.includes('writing')) learningPreferences.writingFocus = true
      if (prefs.includes('listening')) learningPreferences.listeningFocus = true
    } else if (answers.learningPreferences && typeof answers.learningPreferences === 'object') {
      const prefs = answers.learningPreferences as Record<string, unknown>
      learningPreferences.videoPreference = this.toBoundedNumber(
        prefs.videoPreference,
        learningPreferences.videoPreference,
        0,
        100
      )
      learningPreferences.readingPreference = this.toBoundedNumber(
        prefs.readingPreference,
        learningPreferences.readingPreference,
        0,
        100
      )
      learningPreferences.speakingFocus = this.toBoolean(prefs.speakingFocus, learningPreferences.speakingFocus)
      learningPreferences.writingFocus = this.toBoolean(prefs.writingFocus, learningPreferences.writingFocus)
      learningPreferences.listeningFocus = this.toBoolean(prefs.listeningFocus, learningPreferences.listeningFocus)
    }

    // Parse constraints
    const constraints: any = {}
    if (typeof answers.constraints === 'string') {
      const constraintText = answers.constraints.toLowerCase()
      if (constraintText.includes('mobile')) constraints.device = 'mobile'
      if (constraintText.includes('desktop')) constraints.device = 'desktop'
      if (constraintText.includes('accessibility')) constraints.accessibility = answers.constraints
      if (constraintText.includes('exam')) constraints.examFormat = answers.constraints
    } else if (answers.constraints && typeof answers.constraints === 'object') {
      const rawConstraints = answers.constraints as Record<string, unknown>
      if (typeof rawConstraints.device === 'string' && rawConstraints.device.trim()) {
        constraints.device = rawConstraints.device.trim()
      }
      if (typeof rawConstraints.accessibility === 'string' && rawConstraints.accessibility.trim()) {
        constraints.accessibility = rawConstraints.accessibility.trim()
      }
      if (typeof rawConstraints.examFormat === 'string' && rawConstraints.examFormat.trim()) {
        constraints.examFormat = rawConstraints.examFormat.trim()
      }
    }

    const profile: StudentOnboardingProfile = {
      topic: answers.topic || '',
      currentLevel: answers.currentLevel || 'Beginner',
      goalLevel: answers.goalLevel || 'Intermediate',
      targetDate: answers.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contentLanguage: typeof answers.contentLanguage === 'string' && answers.contentLanguage.trim()
        ? answers.contentLanguage.trim()
        : 'English',
      instructionLanguage:
        typeof answers.instructionLanguage === 'string' && answers.instructionLanguage.toLowerCase().includes('same')
          ? (typeof answers.contentLanguage === 'string' && answers.contentLanguage.trim()
              ? answers.contentLanguage.trim()
              : 'English')
          : typeof answers.instructionLanguage === 'string' && answers.instructionLanguage.trim()
            ? answers.instructionLanguage.trim()
            : 'English',
      strictTargetLanguage:
        typeof answers.strictTargetLanguage === 'string'
          ? answers.strictTargetLanguage.toLowerCase().includes('yes') ||
            answers.strictTargetLanguage.toLowerCase().includes('strict')
          : typeof answers.strictTargetLanguage === 'boolean'
            ? answers.strictTargetLanguage
          : true,
      hoursPerDay,
      hoursPerWeek,
      pacePreference,
      learningPreferences,
      constraints,
      additionalNotes: answers.additionalNotes,
    }

    // Validate against schema
    return StudentOnboardingProfileSchema.parse(profile)
  }

  /**
   * Generate a summary of the onboarding session
   */
  async generateSummary(profile: StudentOnboardingProfile): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an admissions officer at an educational institution. Generate a professional summary of a student\'s onboarding profile.',
      },
      {
        role: 'user' as const,
        content: `Generate a summary for this student profile:\n\n${JSON.stringify(profile, null, 2)}`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'Summary unavailable'
  }

  /**
   * Initialize a new onboarding session
   */
  async initializeSession(): Promise<OnboardingState> {
    const state: OnboardingState = {
      answers: {},
      completedQuestions: [],
      currentQuestion: null,
      isComplete: false,
    }

    state.currentQuestion = await this.getNextQuestion(state)

    return state
  }
}

// Singleton instance
let agentInstance: AdmissionsOfficerAgent | null = null

export function getAdmissionsOfficerAgent(): AdmissionsOfficerAgent {
  if (!agentInstance) {
    agentInstance = new AdmissionsOfficerAgent()
  }
  return agentInstance
}
