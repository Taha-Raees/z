/**
 * Grader Agent
 * Grades student submissions and provides feedback
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { GradingResultSchema, type GradingResult, type ExerciseQuestion, type Rubric } from '../schemas'

class GraderAgent {
  private client = getParallelAIClient()

  /**
   * Grade an objective assessment (MCQ, true/false, etc.)
   */
  async gradeObjectiveAssessment(
    questions: ExerciseQuestion[],
    answers: any[]
  ): Promise<GradingResult> {
    let correctCount = 0
    const detailedFeedback: any[] = []

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const answer = answers[i]
      let isCorrect = false
      let feedback = ''
      let correctAnswer: string | undefined

      switch (question.type) {
        case 'mcq':
          isCorrect = answer === question.correctAnswer
          correctAnswer = question.options[question.correctAnswer]
          feedback = isCorrect 
            ? 'Correct!' 
            : `Incorrect. The correct answer is: ${correctAnswer}`
          break

        case 'true_false':
          isCorrect = answer === question.correctAnswer
          correctAnswer = question.correctAnswer.toString()
          feedback = isCorrect 
            ? 'Correct!' 
            : `Incorrect. The answer is: ${correctAnswer}`
          break

        case 'cloze':
          const blank = question.blanks.find(b => b.index === i)
          isCorrect = blank ? answer === blank.answer : false
          correctAnswer = blank?.answer
          feedback = isCorrect 
            ? 'Correct!' 
            : `Incorrect. The correct answer is: ${correctAnswer}`
          break

        case 'short_answer':
          // Check if answer contains keywords
          const answerLower = answer?.toLowerCase() || ''
          const hasKeyword = question.keywords.some(k => 
            answerLower.includes(k.toLowerCase())
          )
          isCorrect = hasKeyword
          correctAnswer = question.expectedAnswer
          feedback = isCorrect 
            ? 'Good answer!' 
            : `Your answer should include: ${question.keywords.join(', ')}`
          break

        case 'matching':
          // For matching, we'd need to check pairs
          isCorrect = true // Simplified for now
          feedback = 'Matching completed'
          break

        case 'reading':
          isCorrect = answer === question.correctAnswer
          correctAnswer = question.correctAnswer
          feedback = isCorrect 
            ? 'Correct!' 
            : `Incorrect. Review the passage again.`
          break

        case 'listening':
          isCorrect = answer === question.correctAnswer
          correctAnswer = question.correctAnswer
          feedback = isCorrect 
            ? 'Correct!' 
            : `Incorrect. Listen again and try once more.`
          break

        default:
          feedback = 'Question type not supported for auto-grading'
      }

      if (isCorrect) correctCount++

      detailedFeedback.push({
        questionIndex: i,
        score: isCorrect ? 100 : 0,
        feedback,
        correctAnswer,
      })
    }

    const score = (correctCount / questions.length) * 100
    const passed = score >= 70

    // Generate improvement plan
    const improvementPlan = await this.generateImprovementPlan(
      questions,
      detailedFeedback,
      score
    )

    return {
      score,
      passed,
      feedback: this.generateOverallFeedback(score, passed),
      detailedFeedback,
      improvementPlan,
    }
  }

  /**
   * Grade a subjective assessment (speaking, writing)
   */
  async gradeSubjectiveAssessment(
    question: ExerciseQuestion,
    answer: string,
    rubric: Rubric
  ): Promise<GradingResult> {
    // Get the question text based on type
    const questionText = question.type === 'speaking' || question.type === 'writing'
      ? question.prompt
      : question.question

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert grader at a prestigious educational institution. Grade student submissions fairly and constructively.

Grading principles:
1. Use the provided rubric consistently
2. Provide specific, actionable feedback
3. Be encouraging while being honest
4. Point out strengths and areas for improvement
5. Suggest specific resources for improvement`,
      },
      {
        role: 'user' as const,
        content: `Grade this student submission:

Question: ${questionText}
Student Answer: ${answer}

Rubric:
${JSON.stringify(rubric, null, 2)}

Grade the submission following the rubric. For each criterion:
- Assign a score based on the levels
- Provide specific feedback explaining the score

Return as JSON with structure:
{
  score: number (0-100),
  passed: boolean,
  feedback: string (overall feedback),
  detailedFeedback: [
    {
      criterion: string,
      score: number,
      maxPoints: number,
      feedback: string
    }
  ],
  improvementPlan: [
    {
      topic: string,
      action: string,
      resources: string[] (optional)
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

    const result = JSON.parse(content)
    return GradingResultSchema.parse(result)
  }

  /**
   * Generate overall feedback based on score
   */
  private generateOverallFeedback(score: number, passed: boolean): string {
    if (score >= 90) {
      return 'Excellent work! You have demonstrated a strong understanding of the material.'
    } else if (score >= 80) {
      return 'Great job! You have a good grasp of the concepts with minor areas for improvement.'
    } else if (score >= 70) {
      return 'Good effort! You have met the passing threshold. Review the feedback to strengthen your understanding.'
    } else if (score >= 60) {
      return 'You\'re making progress, but need to review the material more thoroughly. Focus on the areas where you struggled.'
    } else {
      return 'This assessment indicates you need to review the material more carefully. Consider revisiting the lessons and trying again.'
    }
  }

  /**
   * Generate improvement plan based on performance
   */
  private async generateImprovementPlan(
    questions: ExerciseQuestion[],
    feedback: any[],
    score: number
  ): Promise<Array<{ topic: string; action: string; resources?: string[] }>> {
    // Identify weak areas
    const weakQuestions = feedback.filter(f => f.score < 70)
    
    if (weakQuestions.length === 0) {
      return []
    }

    const weakTopics = weakQuestions.map((f, i) => {
      const q = questions[f.questionIndex]
      return q.type === 'reading' ? 'Reading comprehension' : 
             q.type === 'listening' ? 'Listening comprehension' :
             q.type === 'speaking' ? 'Speaking skills' :
             q.type === 'writing' ? 'Writing skills' : 'General concepts'
    })

    // Remove duplicates
    const uniqueTopics = [...new Set(weakTopics)]

    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Create actionable improvement plans for students.',
      },
      {
        role: 'user' as const,
        content: `Create an improvement plan for a student who scored ${score}%.

Weak areas: ${uniqueTopics.join(', ')}

For each weak area, provide:
- The topic
- A specific action the student can take
- 1-2 suggested resources (optional)

Return as JSON array with fields: topic, action, resources.`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.7,
      priority: 'standard',
    })

    const content = response.selectedResult.choices[0]?.message?.content
    if (!content) {
      return []
    }

    try {
      const plan = JSON.parse(content)
      return Array.isArray(plan) ? plan : []
    } catch {
      return []
    }
  }

  /**
   * Grade a complete assessment attempt
   */
  async gradeAssessmentAttempt(
    assessment: any,
    answers: any[]
  ): Promise<GradingResult> {
    const questions = assessment.questions || []
    
    // Check if any questions require subjective grading
    const hasSubjective = questions.some((q: ExerciseQuestion) => 
      q.type === 'speaking' || q.type === 'writing'
    )

    if (hasSubjective) {
      // Grade each question individually
      const allFeedback: any[] = []
      let totalScore = 0

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        const answer = answers[i]

        if (question.type === 'speaking' || question.type === 'writing') {
          const result = await this.gradeSubjectiveAssessment(
            question,
            answer,
            question.rubric || assessment.rubric
          )
          allFeedback.push(...result.detailedFeedback)
          totalScore += result.score
        } else {
          // Objective grading
          const isCorrect = this.checkObjectiveAnswer(question, answer)
          allFeedback.push({
            questionIndex: i,
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? 'Correct!' : 'Incorrect',
          })
          totalScore += isCorrect ? 100 : 0
        }
      }

      const finalScore = totalScore / questions.length
      return {
        score: finalScore,
        passed: finalScore >= 70,
        feedback: this.generateOverallFeedback(finalScore, finalScore >= 70),
        detailedFeedback: allFeedback,
        improvementPlan: [],
      }
    } else {
      // All objective questions
      return await this.gradeObjectiveAssessment(questions, answers)
    }
  }

  /**
   * Check objective answer
   */
  private checkObjectiveAnswer(question: ExerciseQuestion, answer: any): boolean {
    switch (question.type) {
      case 'mcq':
        return answer === question.correctAnswer
      case 'true_false':
        return answer === question.correctAnswer
      case 'cloze':
        const blank = question.blanks.find(b => b.index === 0)
        return blank ? answer === blank.answer : false
      case 'short_answer':
        const answerLower = answer?.toLowerCase() || ''
        return question.keywords.some(k => 
          answerLower.includes(k.toLowerCase())
        )
      default:
        return false
    }
  }
}

// Singleton instance
let agentInstance: GraderAgent | null = null

export function getGraderAgent(): GraderAgent {
  if (!agentInstance) {
    agentInstance = new GraderAgent()
  }
  return agentInstance
}
