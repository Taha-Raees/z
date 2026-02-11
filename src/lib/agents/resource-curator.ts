/**
 * Resource Curator Agent
 * Finds and curates learning resources (YouTube videos, articles, etc.) for lessons
 * using search-backed discovery + strict URL validation.
 */

import { ResourceCandidateSchema, type ResourceCandidate, type LessonBlueprint } from '../schemas'
import { resolveLanguagePolicy, type LanguagePolicy } from '../language'

type SearchHit = {
  title: string
  url: string
  snippet: string
  source: 'web' | 'youtube'
}

const CACHE_TTL_MS = 30 * 60 * 1000
const MAX_RESULTS_PER_QUERY = 10
const MAX_VALIDATED_RESOURCES = 10
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const BLOCKED_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
])

const STRONG_EDU_HOST_PATTERNS = [
  'youtube.com',
  'youtu.be',
  'wikipedia.org',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'udemy.com',
  'futurelearn.com',
  'open.edu',
  'mit.edu',
  'stanford.edu',
  'harvard.edu',
  'thoughtco.com',
  'bbc.co.uk',
  'medium.com',
  'dev.to',
  'github.com',
]

// Known reliable educational YouTube channels
const RELIABLE_EDU_CHANNELS = new Set([
  'khanacademy',
  'crashcourse',
  'ted-ed',
  'veritasium',
  '3blue1brown',
  'computerphile',
  'numberphile',
  'freecodecamp',
  'thecodingtrain',
  'fireship',
  'traversymedia',
  'academind',
  'programmingwithmosh',
  'codewithharry',
  'brocodez',
  'amigoscode',
  'techworldwithnana',
  'husseinnasser',
  'systemdesignprimer',
])

type CachedResources = {
  resources: ResourceCandidate[]
  timestamp: number
}

class ResourceCuratorAgent {
  private cache = new Map<string, CachedResources>()

  /**
   * Search for resources for a specific lesson
   */
  async findResources(
    topic: string,
    lesson: LessonBlueprint,
    moduleTitle: string,
    preferences: any,
    languagePolicy?: Partial<LanguagePolicy>
  ): Promise<ResourceCandidate[]> {
    const policy = resolveLanguagePolicy(languagePolicy)

    const cacheKey = JSON.stringify({
      topic,
      moduleTitle,
      lesson: lesson.title,
      objectives: lesson.objectives,
      keyTopics: lesson.keyTopics,
      contentLanguage: policy.contentLanguage,
    })

    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.resources
    }

    const queries = this.generateSearchQueries(topic, lesson, moduleTitle, policy)

    const discoveredHits = await this.searchBackedDiscovery(queries)
    const candidateResources = this.mapHitsToCandidates(discoveredHits, lesson, preferences)
    const validatedResources = await this.validateResourceUrls(candidateResources)
    const curated = this.enforceDiversity(validatedResources).slice(0, 5)

    this.cache.set(cacheKey, {
      resources: curated,
      timestamp: Date.now(),
    })

    return curated
  }

  /**
   * Validate resource URLs with strict reachability checks
   */
  async validateResourceUrls(resources: ResourceCandidate[]): Promise<ResourceCandidate[]> {
    const deduped = dedupeByUrl(resources)
    const validated: ResourceCandidate[] = []

    for (const resource of deduped) {
      if (validated.length >= MAX_VALIDATED_RESOURCES) break

      const parsed = safeUrl(resource.url)
      if (!parsed) continue
      if (BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) continue

      if (isYouTubeHost(parsed.hostname)) {
        const validYouTube = await this.validateYouTubeUrl(resource.url)
        if (!validYouTube.ok || !validYouTube.canonicalUrl) {
          continue
        }

        // Boost quality score for known educational channels
        const channelBoost = validYouTube.channel && 
          RELIABLE_EDU_CHANNELS.has(validYouTube.channel.toLowerCase().replace(/\s+/g, '')) ? 0.15 : 0

        const normalized = ResourceCandidateSchema.parse({
          ...resource,
          type: 'youtube',
          url: validYouTube.canonicalUrl,
          channel: validYouTube.channel ?? resource.channel ?? null,
          durationSeconds: resource.durationSeconds ?? null,
          qualityScore: clamp(resource.qualityScore + 0.03 + channelBoost, 0, 1),
        })

        validated.push(normalized)
        continue
      }

      const reachable = await this.checkReachableUrl(resource.url)
      if (!reachable.ok) continue

      const normalized = ResourceCandidateSchema.parse({
        ...resource,
        url: reachable.finalUrl ?? resource.url,
        durationSeconds: resource.durationSeconds ?? null,
        qualityScore: clamp(resource.qualityScore, 0, 1),
      })

      validated.push(normalized)
    }

    return validated.sort((a, b) => {
      const aScore = a.qualityScore * 0.6 + a.relevanceScore * 0.4
      const bScore = b.qualityScore * 0.6 + b.relevanceScore * 0.4
      return bScore - aScore
    })
  }

  /**
   * Generate search queries for finding resources
   */
  private generateSearchQueries(
    topic: string,
    lesson: LessonBlueprint,
    moduleTitle: string,
    languagePolicy?: Partial<LanguagePolicy>
  ): string[] {
    const policy = resolveLanguagePolicy(languagePolicy)
    const objectiveChunk = lesson.objectives.slice(0, 2).join(' ')
    const keyTopicChunk = lesson.keyTopics.slice(0, 2).join(' ')
    const language = policy.contentLanguage

    // Generate diverse queries for better coverage
    return [
      `${topic} ${lesson.title} tutorial`,
      `${topic} ${moduleTitle} ${lesson.title}`,
      `${topic} ${objectiveChunk} explained`,
      `${topic} ${keyTopicChunk} guide`,
      `"${lesson.title}" ${topic} youtube`,
      `${topic} ${lesson.title} ${language} course`,
      `learn ${topic} ${keyTopicChunk}`,
      `${topic} ${lesson.title} for beginners`,
    ]
      .map((q) => q.trim().replace(/\s+/g, ' '))
      .filter((q, i, arr) => q.length > 0 && arr.indexOf(q) === i)
      .slice(0, 8)
  }

  /**
   * Score resources based on multiple criteria
   */
  scoreResource(resource: ResourceCandidate, objectives: string[], preferences: any): number {
    let score = resource.qualityScore * 0.6 + resource.relevanceScore * 0.4

    if (resource.type === 'youtube' && Number(preferences?.videoPreference) > 50) {
      score += 0.08
    }
    if (resource.type === 'article' && Number(preferences?.readingPreference) > 50) {
      score += 0.08
    }

    const text = `${resource.title} ${resource.description}`.toLowerCase()
    const objectiveMatches = objectives.filter((obj) => {
      const token = obj.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
      return token.length > 2 && text.includes(token)
    }).length

    score += Math.min(0.12, objectiveMatches * 0.03)

    return clamp(score, 0, 1)
  }

  /**
   * Get resource metadata (duration, channel, etc.)
   */
  async getResourceMetadata(url: string): Promise<any> {
    const parsed = safeUrl(url)
    if (!parsed) {
      return { type: 'unknown', url }
    }

    if (isYouTubeHost(parsed.hostname)) {
      const videoId = extractYouTubeVideoId(url)
      const validation = await this.validateYouTubeUrl(url)
      return {
        type: 'youtube',
        videoId,
        url: validation.canonicalUrl ?? url,
        durationSeconds: null,
        channel: validation.channel ?? null,
        valid: validation.ok,
      }
    }

    const reachable = await this.checkReachableUrl(url)
    return {
      type: 'other',
      url: reachable.finalUrl ?? url,
      valid: reachable.ok,
    }
  }

  private async searchBackedDiscovery(queries: string[]): Promise<SearchHit[]> {
    const allHits: SearchHit[] = []

    for (const query of queries.slice(0, 5)) {
      try {
        const [webHits, ytHits] = await Promise.allSettled([
          this.searchDuckDuckGo(query),
          this.searchYouTube(query),
        ])

        if (webHits.status === 'fulfilled') {
          allHits.push(...webHits.value)
        }
        if (ytHits.status === 'fulfilled') {
          allHits.push(...ytHits.value)
        }
      } catch {
        // Continue with other queries
      }
    }

    return dedupeHits(allHits).slice(0, 50)
  }

  private async searchDuckDuckGo(query: string): Promise<SearchHit[]> {
    const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    try {
      const html = await this.fetchText(endpoint)
      if (!html) return []

      const hits: SearchHit[] = []
      
      // Multiple patterns to extract results
      const patterns = [
        /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
        /<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      ]

      for (const regex of patterns) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(html)) !== null && hits.length < MAX_RESULTS_PER_QUERY) {
          const rawHref = match[1]
          const href = decodeDuckDuckGoRedirect(rawHref)
          const url = canonicalizeUrl(href)
          if (!url) continue

          const title = decodeHtml(stripHtml(match[2])) || 'Untitled resource'
          
          // Skip low-quality results
          if (title.toLowerCase().includes('pdf') && !url.endsWith('.pdf')) continue
          
          hits.push({
            title,
            url,
            snippet: '',
            source: isYouTubeHost(new URL(url).hostname) ? 'youtube' : 'web',
          })
        }
      }

      return hits
    } catch {
      return []
    }
  }

  private async searchYouTube(query: string): Promise<SearchHit[]> {
    const endpoint = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' educational')}`
    
    try {
      const html = await this.fetchText(endpoint)
      if (!html) return []

      const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g
      const ids = new Set<string>()

      let match: RegExpExecArray | null
      while ((match = videoIdRegex.exec(html)) !== null && ids.size < MAX_RESULTS_PER_QUERY) {
        ids.add(match[1])
      }

      // Also look for video IDs in other formats
      const altRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g
      while ((match = altRegex.exec(html)) !== null && ids.size < MAX_RESULTS_PER_QUERY) {
        ids.add(match[1])
      }

      return Array.from(ids).map((videoId, index) => ({
        title: `YouTube: ${query.slice(0, 40)}...`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        snippet: query,
        source: 'youtube' as const,
      }))
    } catch {
      return []
    }
  }

  private mapHitsToCandidates(
    hits: SearchHit[],
    lesson: LessonBlueprint,
    preferences: any
  ): ResourceCandidate[] {
    const objectiveTokens = tokenize([
      lesson.title,
      ...lesson.objectives,
      ...lesson.keyTopics,
    ].join(' '))

    const candidates: ResourceCandidate[] = []

    for (const hit of hits) {
      const parsed = safeUrl(hit.url)
      if (!parsed) continue
      if (BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) continue

      const text = `${hit.title} ${hit.snippet}`.toLowerCase()
      const overlap = overlapScore(objectiveTokens, tokenize(text))
      const relevanceScore = clamp(0.35 + overlap * 0.65, 0, 1)

      const type = inferResourceType(parsed)
      const domainBoost = hostQualityBoost(parsed.hostname)
      const preferenceBoost =
        type === 'youtube'
          ? Number(preferences?.videoPreference) > 50
            ? 0.08
            : 0
          : type === 'article'
            ? Number(preferences?.readingPreference) > 50
              ? 0.08
              : 0
            : 0

      const qualityScore = clamp(0.45 + domainBoost + overlap * 0.3 + preferenceBoost, 0, 1)

      const title = hit.title && hit.title.trim().length > 0 ? hit.title.trim() : parsed.hostname
      const description = hit.snippet && hit.snippet.trim().length > 0
        ? hit.snippet.trim()
        : `Educational resource for ${lesson.title}`

      const resource = ResourceCandidateSchema.safeParse({
        type,
        title,
        url: hit.url,
        description,
        durationSeconds: null,
        channel: null,
        qualityScore,
        relevanceScore,
        reason:
          overlap > 0
            ? `Selected from search results matching lesson objectives.`
            : `Selected from verified educational sources.`,
      })

      if (resource.success) {
        candidates.push(resource.data)
      }
    }

    return candidates
      .sort((a, b) => {
        const scoreA = this.scoreResource(a, lesson.objectives, preferences)
        const scoreB = this.scoreResource(b, lesson.objectives, preferences)
        return scoreB - scoreA
      })
      .slice(0, 20)
  }

  private enforceDiversity(resources: ResourceCandidate[]): ResourceCandidate[] {
    if (resources.length <= 2) return resources

    const sorted = [...resources].sort((a, b) => {
      const aScore = a.qualityScore * 0.6 + a.relevanceScore * 0.4
      const bScore = b.qualityScore * 0.6 + b.relevanceScore * 0.4
      return bScore - aScore
    })

    const selected: ResourceCandidate[] = []

    // Prioritize YouTube for video content
    const topYouTube = sorted.find((resource) => resource.type === 'youtube')
    const topArticle = sorted.find((resource) => resource.type === 'article')
    const topBook = sorted.find((resource) => resource.type === 'book')

    if (topYouTube) selected.push(topYouTube)
    if (topArticle && !selected.some((r) => r.url === topArticle.url)) selected.push(topArticle)
    if (topBook && !selected.some((r) => r.url === topBook.url)) selected.push(topBook)

    for (const resource of sorted) {
      if (selected.length >= 5) break
      if (selected.some((r) => r.url === resource.url)) continue
      selected.push(resource)
    }

    return selected
  }

  private async validateYouTubeUrl(url: string): Promise<{ ok: boolean; canonicalUrl?: string; channel?: string }> {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) return { ok: false }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    // Try oEmbed first
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      }, 5000)

      if (response.ok) {
        const data = (await response.json()) as { author_name?: string; title?: string }
        
        // Only accept if we got valid metadata
        if (data.title && data.title !== 'Private video' && data.title !== 'Deleted video') {
          return {
            ok: true,
            canonicalUrl,
            channel: data.author_name ?? undefined,
          }
        }
      }
    } catch {
      // oEmbed failed, try HEAD request as fallback
    }

    // Fallback: check if video page is accessible
    try {
      const headResponse = await fetchWithTimeout(canonicalUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': USER_AGENT,
        },
      }, 5000)

      if (headResponse.ok && !headResponse.url.includes('login') && !headResponse.url.includes('unavailable')) {
        return {
          ok: true,
          canonicalUrl,
        }
      }
    } catch {
      // Both methods failed
    }

    return { ok: false }
  }

  private async checkReachableUrl(url: string): Promise<{ ok: boolean; finalUrl?: string }> {
    const parsed = safeUrl(url)
    if (!parsed) return { ok: false }

    try {
      const head = await fetchWithTimeout(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
        },
      }, 5000)

      if (head.ok) {
        const finalUrl = canonicalizeUrl(head.url || url)
        return finalUrl ? { ok: true, finalUrl } : { ok: false }
      }
    } catch {
      // Ignore and try lightweight GET
    }

    try {
      const get = await fetchWithTimeout(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Range: 'bytes=0-2048',
        },
      }, 5000)

      if (!get.ok) return { ok: false }

      const finalUrl = canonicalizeUrl(get.url || url)
      return finalUrl ? { ok: true, finalUrl } : { ok: false }
    } catch {
      return { ok: false }
    }
  }

  private async fetchText(url: string): Promise<string | null> {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
      }, 8000)

      if (!response.ok) return null
      return await response.text()
    } catch {
      return null
    }
  }
}

function inferResourceType(url: URL): ResourceCandidate['type'] {
  if (isYouTubeHost(url.hostname)) return 'youtube'

  const pathname = url.pathname.toLowerCase()
  if (pathname.endsWith('.pdf')) return 'book'
  return 'article'
}

function isYouTubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host.includes('youtube.com') || host.includes('youtu.be')
}

function hostQualityBoost(hostname: string): number {
  const host = hostname.toLowerCase()
  if (STRONG_EDU_HOST_PATTERNS.some((pattern) => host.includes(pattern))) return 0.22
  if (host.endsWith('.edu')) return 0.2
  if (host.endsWith('.org')) return 0.12
  if (host.endsWith('.gov')) return 0.15
  return 0.04
}

function extractYouTubeVideoId(rawUrl: string): string | null {
  const parsed = safeUrl(rawUrl)
  if (!parsed) return null

  if (parsed.hostname.includes('youtu.be')) {
    const id = parsed.pathname.replace(/^\//, '')
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }

  const v = parsed.searchParams.get('v')
  if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v

  const pathParts = parsed.pathname.split('/').filter(Boolean)
  const embedIndex = pathParts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live')
  if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
    const id = pathParts[embedIndex + 1]
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }

  return null
}

function decodeDuckDuckGoRedirect(href: string): string {
  if (href.startsWith('/l/?')) {
    const query = href.split('?')[1] ?? ''
    const params = new URLSearchParams(query)
    const uddg = params.get('uddg')
    if (uddg) {
      try {
        return decodeURIComponent(uddg)
      } catch {
        return uddg
      }
    }
  }

  if (href.startsWith('//')) return `https:${href}`
  return href
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>()
  const output: SearchHit[] = []

  for (const hit of hits) {
    const key = canonicalizeUrl(hit.url)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    output.push({ ...hit, url: key })
  }

  return output
}

function dedupeByUrl(resources: ResourceCandidate[]): ResourceCandidate[] {
  const seen = new Set<string>()
  const output: ResourceCandidate[] = []

  for (const resource of resources) {
    const key = canonicalizeUrl(resource.url)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    output.push({ ...resource, url: key })
  }

  return output
}

function canonicalizeUrl(raw: string): string | null {
  const parsed = safeUrl(raw)
  if (!parsed) return null
  if (!['http:', 'https:'].includes(parsed.protocol)) return null
  if (BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) return null

  const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'si', 'fbclid']
  for (const key of stripParams) {
    parsed.searchParams.delete(key)
  }

  return parsed.toString()
}

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function tokenize(input: string): Set<string> {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)

  return new Set(tokens)
}

function overlapScore(baseTokens: Set<string>, candidateTokens: Set<string>): number {
  if (baseTokens.size === 0 || candidateTokens.size === 0) return 0

  let matches = 0
  for (const token of baseTokens) {
    if (candidateTokens.has(token)) matches += 1
  }

  return matches / baseTokens.size
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeHtml(input: string): string {
  return input
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/</g, '<')
    .replace(/>/g, '>')
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number = 7_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

// Singleton instance
let agentInstance: ResourceCuratorAgent | null = null

export function getResourceCuratorAgent(): ResourceCuratorAgent {
  if (!agentInstance) {
    agentInstance = new ResourceCuratorAgent()
  }
  return agentInstance
}
