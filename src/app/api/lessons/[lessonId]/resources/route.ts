import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResourceCuratorAgent } from '@/lib/agents/resource-curator'
import { buildContextPack } from '@/lib/context-store'
import { safeParseJson } from '@/lib/workflows/program-build-runner'

/**
 * POST /api/lessons/[lessonId]/resources/refresh
 * Refresh lesson resources using context-aware search
 */
export async function POST(
  _: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params

    // Get lesson with module and program
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            program: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const program = lesson.module.program

    // Get context pack for this lesson
    const contextPack = await buildContextPack({
      programId: program.id,
      lessonId: lesson.id,
      moduleId: lesson.moduleId,
    })

    // Build lesson blueprint from existing data
    const objectives = safeParseJson<string[]>(lesson.objectivesJson) || []
    const lessonBlueprint = {
      index: lesson.index,
      title: lesson.title,
      description: `${lesson.title} in ${lesson.module.title}`,
      objectives,
      estimatedMinutes: lesson.estimatedMinutes,
      keyTopics: objectives.slice(0, 3),
    }

    // Get learning preferences from ProgramContext (stored during program build)
    const programContext = await prisma.programContext.findUnique({
      where: { programId: program.id },
    })

    // Parse preferences from context or use sensible defaults
    let preferences: { videoPreference: number; readingPreference: number }
    if (programContext?.constraintsJson) {
      try {
        const constraints = JSON.parse(programContext.constraintsJson) as {
          hoursPerDay?: number
          currentLevel?: string
          goalLevel?: string
        }
        // Infer preferences from hours per day - more hours = more video preference
        const hoursPerDay = constraints.hoursPerDay ?? 2
        const videoPref = Math.min(80, Math.max(40, hoursPerDay * 20))
        preferences = {
          videoPreference: videoPref,
          readingPreference: 100 - videoPref,
        }
      } catch {
        // Fallback to defaults if parsing fails
        preferences = { videoPreference: 60, readingPreference: 40 }
      }
    } else {
      // Fallback to defaults if no context exists
      preferences = { videoPreference: 60, readingPreference: 40 }
    }

    // Get language policy from program
    const languagePolicy = {
      contentLanguage: program.contentLanguage,
      instructionLanguage: program.instructionLanguage,
      strictTargetLanguage: program.strictTargetLanguage,
    }

    // Use resource curator to find new resources with context pack
    const resourceCurator = getResourceCuratorAgent()
    const newResources = await resourceCurator.findResources(
      program.topic,
      lessonBlueprint,
      lesson.module.title,
      preferences,
      languagePolicy,
      contextPack
    )

    // Replace existing resources with new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing resources
      await tx.resource.deleteMany({
        where: { lessonId },
      })

      // Create new resources
      for (const resource of newResources) {
        await tx.resource.create({
          data: {
            lessonId,
            type: resource.type.toUpperCase() as any,
            title: resource.title,
            url: resource.url,
            durationSeconds: resource.durationSeconds ?? null,
            sourceMetaJson: JSON.stringify({
              channel: resource.channel,
              reason: resource.reason,
              relevanceScore: resource.relevanceScore,
              refreshedAt: new Date().toISOString(),
            }),
            qualityScore: resource.qualityScore,
          },
        })
      }
    })

    // Update lesson context with new resource info
    const contextSummary = `Refreshed ${newResources.length} resources for lesson: ${lesson.title}. ` +
      `Resources include ${newResources.filter(r => r.type === 'youtube').length} videos and ` +
      `${newResources.filter(r => r.type === 'article').length} articles.`

    // Return updated resources
    const updatedResources = await prisma.resource.findMany({
      where: { lessonId },
      orderBy: [{ qualityScore: 'desc' }, { retrievedAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      lessonId,
      resources: updatedResources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        durationSeconds: r.durationSeconds,
        qualityScore: r.qualityScore,
        sourceMeta: safeParseJson(r.sourceMetaJson),
      })),
      contextUsed: {
        programContext: !!contextPack.programContext,
        lessonContext: !!contextPack.lessonContext,
        moduleContext: !!contextPack.moduleContext,
      },
      refreshedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refresh lesson resources',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lessons/[lessonId]/resources
 * Get lesson resources with metadata
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params

    const resources = await prisma.resource.findMany({
      where: { lessonId },
      orderBy: [{ qualityScore: 'desc' }, { retrievedAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      lessonId,
      resources: resources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        durationSeconds: r.durationSeconds,
        qualityScore: r.qualityScore,
        sourceMeta: safeParseJson(r.sourceMetaJson),
        retrievedAt: r.retrievedAt,
      })),
      count: resources.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch lesson resources',
      },
      { status: 500 }
    )
  }
}
