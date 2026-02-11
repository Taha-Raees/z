/**
 * Tutor Agent
 * Provides contextual help and explanations for students
 * Uses fast models from OpenRouter for quick responses
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { buildLanguageDirective, resolveLanguagePolicy, type LanguagePolicy } from '../language'

class TutorAgent {
  private client = getParallelAIClient()

  /**
   * Provide help for a specific lesson
   */
  async provideLessonHelp(
    lessonTitle: string,
    lessonObjectives: string[],
    studentQuestion: string,
    lessonContext?: string,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful tutor at a prestigious educational institution. Your role is to guide students to understanding without giving away answers.

Tutoring principles:
1. Be encouraging and supportive
2. Ask guiding questions to help students think through problems
3. Provide hints rather than direct answers
4. Explain concepts in multiple ways if needed
5. Connect to real-world examples when possible
6. Reference the lesson objectives to stay focused

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `A student needs help with this lesson:

Lesson: ${lessonTitle}
Objectives: ${lessonObjectives.join(', ')}
${lessonContext ? `Lesson Context: ${lessonContext}` : ''}

Student's Question: ${studentQuestion}

Provide helpful guidance that:
1. Addresses their question directly
2. Helps them understand the underlying concept
3. Encourages them to try solving it themselves
4. References the lesson objectives where relevant`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'I apologize, but I\'m unable to provide help at this moment.'
  }

  /**
   * Explain a concept
   */
  async explainConcept(
    concept: string,
    context: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert educator who excels at explaining complex concepts clearly and simply.

Explanation principles:
1. Start with a simple, relatable analogy
2. Build up to the formal definition
3. Provide concrete examples
4. Use clear, accessible language
5. Check for understanding with a simple question
6. Adjust complexity based on the specified difficulty level

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Explain this concept for a ${difficulty} level student:

Concept: ${concept}
Context: ${context}

Provide an explanation that:
1. Starts with an analogy or real-world example
2. Clearly defines the concept
3. Gives 2-3 concrete examples
4. Explains why it matters in the context
5. Is appropriate for the specified difficulty level`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'I apologize, but I\'m unable to explain this concept at this moment.'
  }

  /**
   * Provide feedback on an exercise attempt
   */
  async provideExerciseFeedback(
    question: string,
    studentAnswer: string,
    correctAnswer: string,
    explanation: string,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are a supportive tutor who helps students learn from their mistakes.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Provide helpful feedback for this exercise:

Question: ${question}
Student's Answer: ${studentAnswer}
Correct Answer: ${correctAnswer}
Explanation: ${explanation}

Provide feedback that:
1. Acknowledges what they did right (if anything)
2. Gently explains why their answer is incorrect
3. Helps them understand the correct approach
4. Encourages them to try similar problems
5. Is supportive and motivating`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'Keep practicing and you\'ll get it!'
  }

  /**
   * Suggest additional resources
   */
  async suggestResources(
    topic: string,
    currentResources: string[],
    learningPreferences: any,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful tutor who can recommend additional learning resources.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Suggest additional resources for this topic:

Topic: ${topic}
Current Resources: ${currentResources.join(', ') || 'None'}
Learning Preferences:
- Video preference: ${learningPreferences.videoPreference}%
- Reading preference: ${learningPreferences.readingPreference}%
- Speaking focus: ${learningPreferences.speakingFocus}
- Writing focus: ${learningPreferences.writingFocus}
- Listening focus: ${learningPreferences.listeningFocus}

Suggest 3-5 additional resources that:
1. Complement the current materials
2. Match the student's learning preferences
3. Are high-quality and reputable
4. Provide different perspectives or approaches
5. Are freely available when possible

For each resource, provide:
- Title
- Type (video, article, practice, etc.)
- Brief description
- Why it's helpful`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'I recommend reviewing the lesson materials again.'
  }

  /**
   * Provide study tips
   */
  async provideStudyTips(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    timeAvailable: number = 60,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert study skills coach who helps students learn effectively.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Provide study tips for this topic:

Topic: ${topic}
Difficulty Level: ${difficulty}
Time Available: ${timeAvailable} minutes

Provide 5-7 study tips that:
1. Are specific to this topic
2. Are appropriate for the difficulty level
3. Can be done in the available time
4. Use evidence-based learning techniques
5. Include a mix of preparation, active learning, and review strategies

Format as a numbered list with brief explanations.`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'Focus on understanding the key concepts and practice regularly.'
  }

  /**
   * Answer a general question
   */
  async answerQuestion(
    question: string,
    context?: string,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<string> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are a knowledgeable tutor who provides clear, accurate answers to student questions.

Answering principles:
1. Be direct and concise
2. Provide accurate information
3. Give examples when helpful
4. Suggest related topics for further learning
5. Encourage curiosity and deeper understanding

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Answer this student's question:

Question: ${question}
${context ? `Context: ${context}` : ''}

Provide an answer that:
1. Directly addresses the question
2. Is clear and easy to understand
3. Includes relevant examples if helpful
4. Suggests related topics they might want to explore`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'fast',
    })

    return response.selectedResult.choices[0]?.message?.content || 'I\'m not sure about that. Let me look into it and get back to you.'
  }
}

// Singleton instance
let agentInstance: TutorAgent | null = null

export function getTutorAgent(): TutorAgent {
  if (!agentInstance) {
    agentInstance = new TutorAgent()
  }
  return agentInstance
}
