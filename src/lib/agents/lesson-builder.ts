/**
 * Lesson Builder Agent
 * Creates lesson content scaffolds (notes, glossary, key points)
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { LessonNotesSchema, type LessonNotes, type LessonBlueprint, type ResourceCandidate } from '../schemas'
import { buildLanguageDirective, resolveLanguagePolicy, type LanguagePolicy } from '../language'

class LessonBuilderAgent {
  private client = getParallelAIClient()

  /**
   * Build lesson notes from objectives and resources
   */
  async buildLessonNotes(
    lesson: LessonBlueprint,
    resources: ResourceCandidate[],
    moduleTitle: string,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<LessonNotes> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const resourceSummaries = resources.map(r => 
      `- ${r.title}: ${r.description}`
    ).join('\n')

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert instructional designer at a prestigious educational institution. Your task is to create comprehensive lesson notes that help students learn effectively.

Lesson notes should include:
1. A clear summary of what students will learn
2. Key points organized logically
3. A glossary of important terms with definitions and examples
4. Guided notes with questions to check understanding
 5. Additional resources for further learning

The content should be:
- Clear and accessible
- Well-structured with headings
- Practical with real-world examples
- Engaging and motivating

${buildLanguageDirective(policy)}

CRITICAL OUTPUT RULES:
- Return ONLY a JSON OBJECT, no markdown.
- Do NOT output any Zod/schema metadata (_def, typeName, ~standard, etc.).
- Use exactly these fields and types:
  - summary: string
  - keyPoints: string[]
  - glossary: { term: string; definition: string; example?: string }[]
  - guidedNotes: { section: string; content: string; questions?: string[] }[]
  - additionalResources?: { title: string; url: string; description?: string }[]`,
      },
      {
        role: 'user' as const,
        content: `Create lesson notes for:

Module: ${moduleTitle}
Lesson: ${lesson.title}
Description: ${lesson.description}
Objectives: ${lesson.objectives.join('\n- ')}
Key Topics: ${lesson.keyTopics.join(', ')}

Available Resources:
${resourceSummaries}

Generate comprehensive lesson notes following this exact JSON shape:
{
  "summary": "string",
  "keyPoints": ["string"],
  "glossary": [
    { "term": "string", "definition": "string", "example": "string (optional)" }
  ],
  "guidedNotes": [
    { "section": "string", "content": "string", "questions": ["string"] }
  ],
  "additionalResources": [
    { "title": "string", "url": "https://...", "description": "string (optional)" }
  ]
}

Return ONLY JSON object.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<LessonNotes>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
        priority: 'standard',
      },
      LessonNotesSchema
    )

    return LessonNotesSchema.parse(response)
  }

  /**
   * Generate a lesson summary
   */
  async generateSummary(
    lesson: LessonBlueprint,
    resources: ResourceCandidate[]
  ): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Write clear, engaging lesson summaries.',
      },
      {
        role: 'user' as const,
        content: `Write a 2-3 paragraph summary for this lesson:

Title: ${lesson.title}
Description: ${lesson.description}
Objectives: ${lesson.objectives.join(', ')}

The summary should:
- Hook the student's interest
- Explain what they'll learn
- Set expectations for the lesson`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      temperature: 0.8,
      priority: 'standard',
    })

    return response.selectedResult.choices[0]?.message?.content || 'Summary unavailable'
  }

  /**
   * Extract key points from resources
   */
  async extractKeyPoints(
    lesson: LessonBlueprint,
    resources: ResourceCandidate[]
  ): Promise<string[]> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert at identifying the most important concepts in educational content.',
      },
      {
        role: 'user' as const,
        content: `Extract 5-7 key points that students should remember from this lesson:

Title: ${lesson.title}
Objectives: ${lesson.objectives.join(', ')}

Resources:
${resources.map(r => `- ${r.title}: ${r.description}`).join('\n')}

Return as a JSON array of strings.`,
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

    const points = JSON.parse(content)
    return Array.isArray(points) ? points : []
  }

  /**
   * Create a glossary for the lesson
   */
  async createGlossary(
    lesson: LessonBlueprint,
    resources: ResourceCandidate[]
  ): Promise<Array<{ term: string; definition: string; example?: string }>> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Create clear, helpful glossaries for students.',
      },
      {
        role: 'user' as const,
        content: `Create a glossary of 5-10 important terms for this lesson:

Title: ${lesson.title}
Key Topics: ${lesson.keyTopics.join(', ')}

For each term, provide:
- The term
- A clear, simple definition
- An example sentence or context (optional)

Return as JSON array with fields: term, definition, example.`,
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

    const glossary = JSON.parse(content)
    return Array.isArray(glossary) ? glossary : []
  }

  /**
   * Generate guided notes with questions
   */
  async generateGuidedNotes(
    lesson: LessonBlueprint,
    resources: ResourceCandidate[]
  ): Promise<Array<{ section: string; content: string; questions?: string[] }>> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert instructional designer. Create guided notes that help students engage with the material.',
      },
      {
        role: 'user' as const,
        content: `Create guided notes for this lesson:

Title: ${lesson.title}
Objectives: ${lesson.objectives.join(', ')}

Create 3-5 sections, each with:
- A section heading
- Brief content explaining the concept
- 2-3 questions to check understanding

Return as JSON array with fields: section, content, questions.`,
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

    const notes = JSON.parse(content)
    return Array.isArray(notes) ? notes : []
  }
}

// Singleton instance
let agentInstance: LessonBuilderAgent | null = null

export function getLessonBuilderAgent(): LessonBuilderAgent {
  if (!agentInstance) {
    agentInstance = new LessonBuilderAgent()
  }
  return agentInstance
}
