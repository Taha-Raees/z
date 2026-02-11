/**
 * Curriculum Architect Agent
 * Creates program structure (modules, lessons, outcomes) based on student profile
 * Uses NVIDIA NIM for complex reasoning tasks
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { ProgramBlueprintSchema, type ProgramBlueprint, type StudentOnboardingProfile } from '../schemas'
import { buildLanguageDirective, resolveLanguagePolicy, type LanguagePolicy } from '../language'

class CurriculumArchitectAgent {
  private client = getParallelAIClient()

  /**
   * Generate a complete program blueprint from student profile
   */
  async generateProgram(
    profile: StudentOnboardingProfile,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<ProgramBlueprint> {
    const policy = resolveLanguagePolicy({
      contentLanguage: profile.contentLanguage,
      instructionLanguage: profile.instructionLanguage,
      strictTargetLanguage: profile.strictTargetLanguage,
      ...languagePolicy,
    })

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert curriculum architect at a prestigious educational institution. Your task is to design a comprehensive learning program that takes a student from their current level to their goal level.

Key requirements:
1. Create a logical progression of modules that build upon each other
2. Each module should have clear, measurable learning outcomes
3. Estimate realistic time requirements based on the student's availability
4. Include milestones to track progress
5. Ensure the program fits within the target timeline

The program should feel like a real academic course, not just a list of topics.

${buildLanguageDirective(policy)}

All learner-facing fields must be in ${policy.contentLanguage}: title, description, module titles/descriptions, outcomes, milestones.

IMPORTANT: Return ONLY valid JSON. Do not use markdown code blocks. Do not include any text outside the JSON.

CRITICAL: You MUST use these EXACT field names in your JSON response:

For modules array:
- index (number): The module's position in the sequence (0, 1, 2, ...)
- title (string): The module's title
- description (string): A detailed description of what this module covers
- outcomes (array of strings): Learning outcomes for this module
- estimatedHours (number): Estimated hours to complete this module
- lessonsCount (number): Number of lessons in this module

For milestones array:
- title (string): The milestone's title
- week (number): The week number when this milestone occurs
- description (string): Description of what this milestone represents

Example of correct JSON structure:
{
  "title": "Program Title",
  "description": "Program description",
  "modules": [
    {
      "index": 0,
      "title": "Module 1 Title",
      "description": "Module description",
      "outcomes": ["Outcome 1", "Outcome 2"],
      "estimatedHours": 50,
      "lessonsCount": 10
    }
  ],
  "totalLessons": 10,
  "totalHours": 50,
  "estimatedWeeks": 4,
  "milestones": [
    {
      "title": "Milestone 1",
      "week": 2,
      "description": "Milestone description"
    }
  ]
}`,
      },
      {
        role: 'user' as const,
        content: `Design a learning program for this student:

Topic: ${profile.topic}
Current Level: ${profile.currentLevel}
Goal Level: ${profile.goalLevel}
Target Date: ${profile.targetDate}
Available Time: ${profile.hoursPerDay} hours/day, ${profile.hoursPerWeek} hours/week
Pace Preference: ${profile.pacePreference}
Learning Preferences: ${JSON.stringify(profile.learningPreferences)}
Constraints: ${JSON.stringify(profile.constraints)}
Additional Notes: ${profile.additionalNotes || 'None'}

Generate a complete program blueprint following the EXACT schema shown in the system message.
Return ONLY valid JSON. Do not use markdown code blocks.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ProgramBlueprint>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
      },
      ProgramBlueprintSchema
    )

    return ProgramBlueprintSchema.parse(response)
  }

  /**
   * Generate module details for a specific module
   */
  async generateModuleDetails(
    profile: StudentOnboardingProfile,
    moduleIndex: number,
    moduleTitle: string,
    previousModules: string[] = []
  ): Promise<any> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert curriculum designer. Create detailed module content that builds logically on previous modules.',
      },
      {
        role: 'user' as const,
        content: `Create detailed content for module ${moduleIndex + 1}: "${moduleTitle}"

Student Profile:
- Topic: ${profile.topic}
- Current Level: ${profile.currentLevel}
- Goal Level: ${profile.goalLevel}
- Pace: ${profile.pacePreference}

Previous Modules: ${previousModules.join(', ') || 'None (this is the first module)'}

Generate:
1. A detailed description of what this module covers
2. 5-7 specific learning outcomes
3. Key topics that will be covered
4. Estimated hours to complete
5. Number of lessons (typically 5-10)

Return as JSON with these fields: description, outcomes (array), keyTopics (array), estimatedHours, lessonsCount`,
      },
    ]

    const response = await this.client.chatCompletion({
      messages,
      task: 'reasoning',
      temperature: 0.7,
      priority: 'reasoning',
    })

    const content = response.selectedResult.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    // Parse JSON, handling markdown code blocks
    let jsonContent = content
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1]
    }

    return JSON.parse(jsonContent.trim())
  }

  /**
   * Validate program feasibility
   */
  async validateProgram(
    profile: StudentOnboardingProfile,
    program: ProgramBlueprint
  ): Promise<{ valid: boolean; issues: string[]; suggestions: string[] }> {
    const issues: string[] = []
    const suggestions: string[] = []

    // Check if total hours fit within available time
    const totalWeeks = program.estimatedWeeks
    const totalAvailableHours = profile.hoursPerWeek * totalWeeks
    const totalRequiredHours = program.totalHours

    if (totalRequiredHours > totalAvailableHours) {
      issues.push(
        `Program requires ${totalRequiredHours} hours but only ${totalAvailableHours} hours are available in the target timeline.`
      )
      suggestions.push(
        'Consider extending the target date or reducing the number of modules/lessons.'
      )
    }

    // Check if modules have sufficient content
    if (program.modules.length < 3) {
      issues.push('Program has fewer than 3 modules, which may not provide comprehensive coverage.')
      suggestions.push('Consider adding more modules to ensure thorough coverage of the topic.')
    }

    // Check if outcomes are specific and measurable
    for (const module of program.modules) {
      if (module.outcomes.length < 3) {
        issues.push(`Module "${module.title}" has fewer than 3 learning outcomes.`)
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    }
  }

  /**
   * Adjust program based on validation feedback
   */
  async adjustProgram(
    profile: StudentOnboardingProfile,
    program: ProgramBlueprint,
    validation: { issues: string[]; suggestions: string[] },
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<ProgramBlueprint> {
    const policy = resolveLanguagePolicy({
      contentLanguage: profile.contentLanguage,
      instructionLanguage: profile.instructionLanguage,
      strictTargetLanguage: profile.strictTargetLanguage,
      ...languagePolicy,
    })

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert curriculum architect. Adjust a program to address validation issues while maintaining educational quality.

${buildLanguageDirective(policy)}

IMPORTANT: Return ONLY valid JSON. Do not use markdown code blocks. Do not include any text outside the JSON.`,
      },
      {
        role: 'user' as const,
        content: `Adjust this program to address the following issues:

Issues:
${validation.issues.map(i => `- ${i}`).join('\n')}

Suggestions:
${validation.suggestions.map(s => `- ${s}`).join('\n')}

Current Program:
${JSON.stringify(program, null, 2)}

Student Profile:
- Topic: ${profile.topic}
- Current Level: ${profile.currentLevel}
- Goal Level: ${profile.goalLevel}
- Available Time: ${profile.hoursPerWeek} hours/week

Return the adjusted program following the same schema. Return ONLY valid JSON. Do not use markdown code blocks.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ProgramBlueprint>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
      },
      ProgramBlueprintSchema
    )

    return ProgramBlueprintSchema.parse(response)
  }
}

// Singleton instance
let agentInstance: CurriculumArchitectAgent | null = null

export function getCurriculumArchitectAgent(): CurriculumArchitectAgent {
  if (!agentInstance) {
    agentInstance = new CurriculumArchitectAgent()
  }
  return agentInstance
}
