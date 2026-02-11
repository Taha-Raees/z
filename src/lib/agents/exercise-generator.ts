/**
 * Exercise Generator Agent
 * Creates practice exercises for lessons
 * Uses NVIDIA NIM for complex reasoning tasks
 */

import { getParallelAIClient } from '../ai/parallel-client'
import { ExerciseSetSchema, type ExerciseSet, type LessonBlueprint } from '../schemas'
import { buildLanguageDirective, resolveLanguagePolicy, type LanguagePolicy } from '../language'

class ExerciseGeneratorAgent {
  private client = getParallelAIClient()

  private createFallbackExerciseSet(
    lesson: LessonBlueprint,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    type: 'mixed' | 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'vocabulary',
    previousMistakes: string[] = [],
    languagePolicy?: Partial<LanguagePolicy>
  ): ExerciseSet {
    const policy = resolveLanguagePolicy(languagePolicy)
    const targetLang = policy.contentLanguage.toLowerCase()
    const isEnglish = targetLang === 'english' || targetLang === 'en'
    
    const objectiveA = lesson.objectives[0] ?? `Understand ${lesson.title}`
    const objectiveB = lesson.objectives[1] ?? lesson.keyTopics[0] ?? objectiveA
    const objectiveC = lesson.objectives[2] ?? lesson.keyTopics[1] ?? objectiveA
    const focus = previousMistakes[0] ?? lesson.keyTopics[0] ?? 'core concept'

    // Helper to get content based on target language
    const t = (en: string, de: string, es: string, fr: string): string => {
      if (isEnglish) return en
      if (targetLang.includes('german') || targetLang.includes('deutsch') || targetLang.includes('de')) return de
      if (targetLang.includes('spanish') || targetLang.includes('español') || targetLang.includes('es')) return es
      if (targetLang.includes('french') || targetLang.includes('français') || targetLang.includes('fr')) return fr
      return en // Default to English if language not supported
    }

    return {
      title: isEnglish 
        ? `${lesson.title} Practice Set`
        : `[${policy.contentLanguage}] Übungssatz: ${lesson.title}`,
      description: isEnglish
        ? `Practice set focused on ${lesson.title}.`
        : `[${policy.contentLanguage}] Übungssatz zum Thema ${lesson.title}.`,
      difficulty,
      type,
      estimatedMinutes: 25,
      instructions: isEnglish
        ? `Focus carefully on: ${focus}. Reattempt incorrect items after reviewing notes.`
        : `[${policy.contentLanguage}] Konzentrieren Sie sich auf: ${focus}. Wiederholen Sie falsche Antworten nach dem Nachschlagen.`,
      questions: [
        {
          type: 'mcq',
          question: t(
            `Which option best matches this lesson objective: "${objectiveA}"?`,
            `Welche Option passt am besten zu diesem Lernziel: "${objectiveA}"?`,
            `¿Qué opción coincide mejor con este objetivo de aprendizaje: "${objectiveA}"?`,
            `Quelle option correspond le mieux à cet objectif d'apprentissage: "${objectiveA}"?`
          ),
          options: [
            t('Core concept', 'Kernkonzept', 'Concepto central', 'Concept central'),
            t('Unrelated concept', 'Unzusammenhängendes Konzept', 'Concepto no relacionado', 'Concept non lié'),
            t('Opposite concept', 'Gegenteiliges Konzept', 'Concepto opuesto', 'Concept opposé'),
            t('Unsure', 'Unsicher', 'Inseguro', 'Incertain'),
          ],
          correctAnswer: 0,
          explanation: t(
            'The first option is intentionally aligned with the lesson objective.',
            'Die erste Option ist absichtlich auf das Lernziel ausgerichtet.',
            'La primera opción está intencionalmente alineada con el objetivo de aprendizaje.',
            'La première option est intentionnellement alignée sur l\'objectif d\'apprentissage.'
          ),
          difficulty,
        },
        {
          type: 'true_false',
          question: t(
            `True or False: "${objectiveB}" should be practiced using short examples before complex tasks.`,
            `Richtig oder Falsch: "${objectiveB}" sollte mit kurzen Beispielen geübt werden, bevor komplexe Aufgaben folgen.`,
            `Verdadero o Falso: "${objectiveB}" debe practicarse usando ejemplos cortos antes de tareas complejas.`,
            `Vrai ou Faux: "${objectiveB}" doit être pratiqué en utilisant des exemples courts avant des tâches complexes.`
          ),
          correctAnswer: true,
          explanation: t(
            'Scaffolded practice is usually the fastest route to retention.',
            'Gestuftes Üben ist normalerweise der schnellste Weg zur Behaltensleistung.',
            'La práctica graduada suele ser la ruta más rápida hacia la retención.',
            'La pratique échafaudée est généralement le moyen le plus rapide de mémorisation.'
          ),
          difficulty,
        },
        {
          type: 'matching',
          question: t(
            'Match each study action to the expected learning outcome.',
            'Ordnen Sie jede Lernaktion dem erwarteten Lernergebnis zu.',
            'Empareje cada acción de estudio con el resultado de aprendizaje esperado.',
            'Associez chaque action d\'étude au résultat d\'apprentissage attendu.'
          ),
          pairs: [
            {
              left: t('Review glossary', 'Glossar wiederholen', 'Repasar glosario', 'Réviser le glossaire'),
              right: t('Improve term recognition', 'Begriffserkennung verbessern', 'Mejorar reconocimiento de términos', 'Améliorer la reconnaissance des termes'),
            },
            {
              left: t('Do workbook drills', 'Arbeitsbuchübungen machen', 'Hacer ejercicios del libro', 'Faire des exercices de cahier'),
              right: t('Improve response speed', 'Reaktionsgeschwindigkeit verbessern', 'Mejorar velocidad de respuesta', 'Améliorer la vitesse de réponse'),
            },
            {
              left: t('Explain concept aloud', 'Konzept laut erklären', 'Explicar concepto en voz alta', 'Expliquer le concept à voix haute'),
              right: t('Improve recall depth', 'Erinnerungstiefe verbessern', 'Mejorar profundidad de recuerdo', 'Améliorer la profondeur du rappel'),
            },
          ],
          explanation: t(
            'Each action maps to a specific cognitive gain.',
            'Jede Aktion führt zu einem spezifischen kognitiven Gewinn.',
            'Cada acción corresponde a una ganancia cognitiva específica.',
            'Chaque action correspond à un gain cognitif spécifique.'
          ),
          difficulty,
        },
        {
          type: 'cloze',
          question: t(
            'Complete the statement: "Today I practiced [blank0] and improved in [blank1]."',
            'Vervollständigen Sie den Satz: "Heute habe ich [blank0] geübt und mich in [blank1] verbessert."',
            'Complete la afirmación: "Hoy practiqué [blank0] y mejoré en [blank1]."',
            'Complétez l\'énoncé: "Aujourd\'hui j\'ai pratiqué [blank0] et je me suis amélioré en [blank1]."'
          ),
          blanks: [
            { index: 0, answer: objectiveA, alternatives: [objectiveB, objectiveC] },
            { index: 1, answer: focus, alternatives: [objectiveB, objectiveC] },
          ],
          explanation: t(
            'Use the most relevant objective and weak area for full credit.',
            'Verwenden Sie das relevanteste Ziel und Schwächengebiet für volle Punkte.',
            'Use el objetivo más relevante y el área débil para obtener la calificación completa.',
            'Utilisez l\'objectif le plus pertinent et le point faible pour obtenir tous les points.'
          ),
          difficulty,
        },
        {
          type: 'short_answer',
          question: t(
            `In 1-2 lines, explain how "${objectiveC}" connects to this lesson.`,
            `Erklären Sie in 1-2 Zeilen, wie "${objectiveC}" mit dieser Lektion zusammenhängt.`,
            `En 1-2 líneas, explique cómo "${objectiveC}" se conecta a esta lección.`,
            `En 1-2 lignes, explique comment "${objectiveC}" se connecte à cette leçon.`
          ),
          expectedAnswer: t(
            `${objectiveC} connects to the lesson by reinforcing the core objective in practical use.`,
            `${objectiveC} verbindet sich mit der Lektion, indem es das Kernziel in der praktischen Anwendung verstärkt.`,
            `${objectiveC} se conecta a la lección al reforzar el objetivo central en uso práctico.`,
            `${objectiveC} se connecte à la leçon en renforçant l\'objectif central dans l\'utilisation pratique.`
          ),
          keywords: objectiveC
            .split(' ')
            .filter(Boolean)
            .slice(0, 3),
          explanation: t(
            'Include the objective term and one practical connection.',
            'Fügen Sie den Zielbegriff und eine praktische Verbindung hinzu.',
            'Incluya el término objetivo y una conexión práctica.',
            'Incluez le terme objectif et une connexion pratique.'
          ),
          difficulty,
        },
        {
          type: 'reading',
          passage: t(
            `A student completed a lesson on "${lesson.title}" and then revised three ideas: ${objectiveA}; ${objectiveB}; ${objectiveC}. The student identified "${focus}" as the weakest area and scheduled extra practice.`,
            `Ein Student hat eine Lektion über "${lesson.title}" abgeschlossen und dann drei Ideen wiederholt: ${objectiveA}; ${objectiveB}; ${objectiveC}. Der Student identifizierte "${focus}" als schwächsten Bereich und plante zusätzliches Üben.`,
            `Un estudiante completó una lección sobre "${lesson.title}" y luego revisó tres ideas: ${objectiveA}; ${objectiveB}; ${objectiveC}. El estudiante identificó "${focus}" como el área más débil y programó práctica adicional.`,
            `Un étudiant a terminé une leçon sur "${lesson.title}" puis a révisé trois idées: ${objectiveA}; ${objectiveB}; ${objectiveC}. L\'étudiant a identifié "${focus}" comme le point faible et a programmé une pratique supplémentaire.`
          ),
          question: t(
            'What did the student mark as the weakest area?',
            'Welchen Bereich markierte der Student als schwächsten?',
            '¿Qué área marcó el estudiante como la más débil?',
            'Quelle zone l\'étudiant a-t-il identifiée comme la plus faible ?'
          ),
          correctAnswer: focus,
          explanation: t(
            'The passage explicitly identifies the weak area near the end.',
            'Der Text identifiziert den schwachen Bereich explizit gegen Ende.',
            'El pasaje identifica explícitamente el área débil cerca del final.',
            'Le passage identifie explicitement le point faible vers la fin.'
          ),
          difficulty,
        },
      ],
    }
  }

  private ensureQuestionCoverage(
    exerciseSet: ExerciseSet,
    lesson: LessonBlueprint,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    type: 'mixed' | 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'vocabulary',
    previousMistakes: string[] = [],
    languagePolicy?: Partial<LanguagePolicy>
  ): ExerciseSet {
    const fallback = this.createFallbackExerciseSet(
      lesson,
      difficulty,
      type,
      previousMistakes,
      languagePolicy
    )
    const mergedQuestions = [...exerciseSet.questions, ...fallback.questions].slice(0, 10)

    return ExerciseSetSchema.parse({
      ...exerciseSet,
      title: exerciseSet.title || fallback.title,
      description: exerciseSet.description || fallback.description,
      difficulty,
      type,
      estimatedMinutes: Math.max(15, Math.min(90, exerciseSet.estimatedMinutes || fallback.estimatedMinutes)),
      instructions: exerciseSet.instructions || fallback.instructions,
      questions: mergedQuestions,
    })
  }

  /**
   * Generate an exercise set for a lesson
   */
  async generateExerciseSet(
    lesson: LessonBlueprint,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    type: 'mixed' | 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'vocabulary',
    previousMistakes: string[] = [],
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<ExerciseSet> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert exercise designer.

Return ONLY valid JSON object matching this exact contract:
- Top-level fields: title, description, difficulty, type, estimatedMinutes, questions, instructions?
- Use ONLY these question "type" discriminator values:
  mcq | true_false | matching | cloze | short_answer | listening | reading | speaking | writing

Per-question required fields:
- mcq: question, options(string[]), correctAnswer(number index), explanation, difficulty
- true_false: question, correctAnswer(boolean), explanation, difficulty
- matching: question, pairs([{left,right}]), explanation, difficulty
- cloze: question, blanks([{index,answer,alternatives?}]), explanation, difficulty
- short_answer: question, expectedAnswer, keywords(string[]), explanation, difficulty
- listening: question, correctAnswer, explanation, difficulty, audioUrl?/transcript?
- reading: passage, question, correctAnswer, explanation, difficulty
- speaking: prompt, rubric({criteria:[{name,description,maxPoints}]}), difficulty, timeLimitSeconds?
- writing: prompt, rubric({criteria:[{name,description,maxPoints}]}), difficulty, wordLimit({min,max})?

CRITICAL: wordLimit MUST be an OBJECT with min and max properties, NOT a number.
Example: "wordLimit": {"min": 100, "max": 200}
WRONG: "wordLimit": 200

Strict rules:
- Never use markdown/code fences.
- Never invent schema metadata keys.
- Keep question count 8-10.
- Keep all discriminator strings lowercase exactly as listed.

${buildLanguageDirective(policy)}`,
      },
      {
        role: 'user' as const,
        content: `Generate an exercise set for this lesson:

Lesson: ${lesson.title}
Description: ${lesson.description}
Objectives: ${lesson.objectives.join('\n- ')}
Key Topics: ${lesson.keyTopics.join(', ')}

Exercise Parameters:
- Difficulty: ${difficulty}
- Type: ${type}
- Previous mistakes to address: ${previousMistakes.join(', ') || 'None'}

Generate 8-10 questions.
If type is "mixed", include at least 5 distinct question types.
Keep content practical and concise.

Return ONLY valid JSON object.`,
      },
    ]

    try {
      const response = await this.client.chatCompletionWithSchema<ExerciseSet>(
        {
          messages,
          task: 'reasoning',
          disableSystemRole: true,
          temperature: 0.35,
          priority: 'standard',
        },
        ExerciseSetSchema,
        2
      )

      return this.ensureQuestionCoverage(
        ExerciseSetSchema.parse(response),
        lesson,
        difficulty,
        type,
        previousMistakes,
        policy
      )
    } catch {
      return this.createFallbackExerciseSet(lesson, difficulty, type, previousMistakes, policy)
    }
  }

  /**
   * Generate more exercises like existing ones (regeneration)
   */
  async regenerateExercises(
    existingSet: ExerciseSet,
    count: number = 5
  ): Promise<ExerciseSet> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert exercise designer. Create similar exercises to existing ones with new content.',
      },
      {
        role: 'user' as const,
        content: `Generate ${count} new exercises similar to these:

Existing Exercises:
${JSON.stringify(existingSet.questions, null, 2)}

Create new exercises that:
- Test the same learning objectives
- Have the same difficulty level (${existingSet.difficulty})
- Use different content/examples
- Follow the same question types

Return as a new ExerciseSet with the same structure.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ExerciseSet>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.8,
        priority: 'standard',
      },
      ExerciseSetSchema
    )

    return ExerciseSetSchema.parse(response)
  }

  /**
   * Generate targeted practice for weak areas
   */
  async generateTargetedPractice(
    weakTopics: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    context: string
  ): Promise<ExerciseSet> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Create focused practice exercises for specific weak areas.',
      },
      {
        role: 'user' as const,
        content: `Generate targeted practice exercises for these weak areas:

Weak Topics: ${weakTopics.join(', ')}
Difficulty: ${difficulty}
Context: ${context}

Create 6-10 exercises that specifically address these weak areas.
Include a variety of question types and provide clear explanations.

Return as an ExerciseSet.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ExerciseSet>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
        priority: 'standard',
      },
      ExerciseSetSchema
    )

    return ExerciseSetSchema.parse(response)
  }

  /**
   * Adjust exercise difficulty
   */
  async adjustDifficulty(
    exerciseSet: ExerciseSet,
    newDifficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<ExerciseSet> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Adjust exercise difficulty while maintaining learning objectives.',
      },
      {
        role: 'user' as const,
        content: `Adjust these exercises to ${newDifficulty} difficulty:

Current Exercises:
${JSON.stringify(exerciseSet.questions, null, 2)}

Adjustments:
- For beginner: Make questions simpler, more direct, with clearer hints
- For intermediate: Add some complexity, require deeper understanding
- For advanced: Include nuanced scenarios, require synthesis of concepts

Return as a new ExerciseSet with adjusted difficulty.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ExerciseSet>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
        priority: 'standard',
      },
      ExerciseSetSchema
    )

    return ExerciseSetSchema.parse(response)
  }

  /**
   * Generate spaced repetition exercises
   */
  async generateSpacedRepetition(
    previousExercises: ExerciseSet[],
    daysSinceReview: number
  ): Promise<ExerciseSet> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educator. Create spaced repetition exercises to reinforce learning.',
      },
      {
        role: 'user' as const,
        content: `Generate spaced repetition exercises based on previous work:

Days since last review: ${daysSinceReview}

Previous Exercise Topics:
${previousExercises.map(e => e.title).join(', ')}

Create 5-8 exercises that:
- Review key concepts from previous lessons
- Test retention of important material
- Include some new variations to keep it engaging
- Are appropriate for the time elapsed (more review if longer gap)

Return as an ExerciseSet.`,
      },
    ]

    const response = await this.client.chatCompletionWithSchema<ExerciseSet>(
      {
        messages,
        task: 'reasoning',
        disableSystemRole: true,
        temperature: 0.7,
        priority: 'standard',
      },
      ExerciseSetSchema
    )

    return ExerciseSetSchema.parse(response)
  }
}

// Singleton instance
let agentInstance: ExerciseGeneratorAgent | null = null

export function getExerciseGeneratorAgent(): ExerciseGeneratorAgent {
  if (!agentInstance) {
    agentInstance = new ExerciseGeneratorAgent()
  }
  return agentInstance
}
