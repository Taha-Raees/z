export type LanguagePolicy = {
  contentLanguage: string
  instructionLanguage: string
  strictTargetLanguage: boolean
}

const DEFAULT_CONTENT_LANGUAGE = 'English'
const DEFAULT_INSTRUCTION_LANGUAGE = 'English'

const ENGLISH_STOPWORDS = new Set([
  'the',
  'and',
  'is',
  'are',
  'to',
  'of',
  'in',
  'for',
  'with',
  'that',
  'this',
  'you',
  'your',
  'from',
  'what',
  'when',
  'where',
  'which',
  'how',
  'why',
  'can',
  'could',
  'should',
  'will',
  'would',
  'about',
  'into',
  'through',
  'between',
  'because',
  'more',
  'most',
  'than',
  'then',
  'very',
  'also',
  'only',
  'not',
  'true',
  'false',
])

export function normalizeLanguageName(value: unknown, fallback: string = DEFAULT_CONTENT_LANGUAGE): string {
  if (typeof value !== 'string') return fallback

  const cleaned = value.trim()
  if (!cleaned) return fallback

  return cleaned
}

export function resolveLanguagePolicy(input?: Partial<LanguagePolicy> | null): LanguagePolicy {
  return {
    contentLanguage: normalizeLanguageName(input?.contentLanguage, DEFAULT_CONTENT_LANGUAGE),
    instructionLanguage: normalizeLanguageName(input?.instructionLanguage, DEFAULT_INSTRUCTION_LANGUAGE),
    strictTargetLanguage: input?.strictTargetLanguage ?? true,
  }
}

export function buildLanguageDirective(policy: LanguagePolicy): string {
  const targetLang = policy.contentLanguage.toLowerCase()
  const isEnglish = targetLang === 'english' || targetLang === 'en'
  
  if (isEnglish) {
    return `
Language policy:
- All content must be in English
- This includes questions, answers, explanations, and all learner-facing text
`.trim()
  }

  return `
CRITICAL LANGUAGE REQUIREMENT - YOU MUST FOLLOW THIS:
- Target language: ${policy.contentLanguage}
- ALL content MUST be written in ${policy.contentLanguage}
- This includes: questions, answers, options, explanations, passages, prompts, and all learner-facing text
- ZERO English words allowed except proper nouns/names
- If the target language is German: write everything in German
- If the target language is Spanish: write everything in Spanish
- If the target language is French: write everything in French
- Before responding, verify every sentence is in ${policy.contentLanguage}
- DO NOT output any English except in code/technical terms if absolutely necessary
- Content in wrong language will be rejected
`.trim()
}

function collectTextFragments(input: unknown, bucket: string[], limit: number): void {
  if (bucket.length >= limit) return

  if (typeof input === 'string') {
    const value = input.trim()
    if (value.length > 1) {
      bucket.push(value)
    }
    return
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      collectTextFragments(item, bucket, limit)
      if (bucket.length >= limit) return
    }
    return
  }

  if (input && typeof input === 'object') {
    for (const value of Object.values(input as Record<string, unknown>)) {
      collectTextFragments(value, bucket, limit)
      if (bucket.length >= limit) return
    }
  }
}

function englishTokenRatio(fragments: string[]): number {
  let tokenCount = 0
  let englishHits = 0

  for (const fragment of fragments) {
    const tokens = fragment
      .toLowerCase()
      .match(/[a-zA-Z][a-zA-Z'-]*/g)

    if (!tokens) continue

    for (const token of tokens) {
      tokenCount += 1
      if (ENGLISH_STOPWORDS.has(token)) {
        englishHits += 1
      }
    }
  }

  if (tokenCount === 0) return 0
  return englishHits / tokenCount
}

export function violatesTargetLanguage(input: unknown, policy: LanguagePolicy): boolean {
  if (!policy.strictTargetLanguage) return false

  const target = policy.contentLanguage.toLowerCase()
  if (target === 'english' || target === 'en') return false

  const fragments: string[] = []
  collectTextFragments(input, fragments, 500)

  if (fragments.length === 0) return false

  const ratio = englishTokenRatio(fragments)
  return ratio > 0.2
}
