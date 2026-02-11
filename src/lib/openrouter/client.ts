/**
 * OpenRouter API Client
 * Simplified client that uses specific models without discovery/routing
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  task?: 'fast' | 'reasoning' | 'resource'
  disableSystemRole?: boolean
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  tools?: any[]
  response_format?: { type: 'json_object' }
  stream?: boolean
  timeoutMs?: number
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      reasoning?: string
      tool_calls?: any[]
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

class OpenRouterClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const model = options.model || 'arcee-ai/trinity-large-preview:free'
    const startedAt = Date.now()

    const timeoutMs = Math.max(5_000, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const payloadMessages = options.disableSystemRole
      ? options.messages.map((m, index) =>
          m.role === 'system'
            ? {
                role: 'user',
                content: `Instruction${index + 1}:\n${m.content}`,
              }
            : m
        )
      : options.messages

    try {
      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Education System',
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          tools: options.tools,
          response_format: options.response_format,
          stream: options.stream ?? false,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenRouter API error (${model}): ${response.statusText} - ${error}`)
      }

      const data = await response.json()

      if (data?.error) {
        throw new Error(
          `OpenRouter provider error (${model}): ${data.error.message || 'Unknown error'}${
            data.error.code ? ` [code ${data.error.code}]` : ''
          }`
        )
      }

      const latencyMs = Date.now() - startedAt
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[OpenRouter] model=${model} provider=${data.provider ?? 'unknown'} tokens=${data.usage?.total_tokens ?? 'n/a'} latency=${latencyMs}ms`
        )
      }

      return data
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  /**
   * Make a chat completion request with schema validation
   * Retries with repair prompt if output is invalid
   */
  async chatCompletionWithSchema<T>(
    options: ChatCompletionOptions,
    schema: any,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null
    const retryMessages = [...options.messages]

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const enforceJsonObject = schema?.type !== 'array'

        const response = await this.chatCompletion({
          ...options,
          messages: retryMessages,
          response_format: enforceJsonObject ? { type: 'json_object' } : undefined,
        })

        // Check if response has expected structure
        if (!response.choices || response.choices.length === 0) {
          throw new Error('OpenRouter API returned no choices in response. This may indicate an invalid API key or model.')
        }

        const message = response.choices[0]?.message as any
        const content =
          (typeof message?.content === 'string' ? message.content.trim() : '') ||
          (typeof message?.reasoning === 'string' ? message.reasoning.trim() : '')

        if (!content) {
          throw new Error('No content in response')
        }

        const parsed = this.parseJsonFromContent(content)

        // Array schema normalization for inconsistent model outputs
        if (schema?.type === 'array') {
          let normalized: any[]

          if (Array.isArray(parsed)) {
            normalized = parsed
          } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.resources)) {
            normalized = parsed.resources
          } else if (
            parsed &&
            typeof parsed === 'object' &&
            'type' in parsed &&
            'title' in parsed &&
            'url' in parsed
          ) {
            normalized = [parsed]
          } else {
            throw new Error('Expected an array-like response but received incompatible JSON shape')
          }

          if (schema?.items?.safeParse) {
            const validated = normalized.map((item) => {
              const result = schema.items.safeParse(item)
              if (!result.success) {
                throw new Error(`Array item validation failed: ${result.error.message}`)
              }
              return result.data
            })

            return validated as T
          }

          return normalized as T
        }

        // Zod schema validation when available
        if (schema?.safeParse) {
          const result = schema.safeParse(parsed)
          if (!result.success) {
            throw new Error(result.error.message)
          }
          return result.data as T
        }

        return parsed as T
      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt + 1} failed:`, error)

        // Add repair prompt for next attempt
        if (attempt < maxRetries - 1) {
          const schemaHint =
            schema?.type === 'array'
              ? 'Return a JSON ARRAY only.'
              : 'Return a JSON OBJECT only.'

          retryMessages.push({
            role: 'user',
            content: `Your previous response was invalid. Please fix it and provide valid JSON that matches the required schema. Error: ${lastError.message}

Make sure to:
1. Return ONLY valid JSON (no markdown code blocks)
2. Ensure all strings are properly terminated with quotes
3. Ensure all objects and arrays are properly closed
4. Do not include any text outside the JSON
5. ${schemaHint}`,
          })
        }
      }
    }

    throw lastError || new Error('Failed to get valid response')
  }

  /**
   * Extract and parse JSON from model output content
   */
  private parseJsonFromContent(content: string): any {
    let jsonContent = content

    // Try to extract JSON from markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1]
    }

    const trimmed = jsonContent.trim()

    try {
      return JSON.parse(trimmed)
    } catch {
      // Fallback: isolate largest likely JSON object/array span
      const firstObject = trimmed.indexOf('{')
      const firstArray = trimmed.indexOf('[')
      const first =
        firstObject === -1
          ? firstArray
          : firstArray === -1
            ? firstObject
            : Math.min(firstObject, firstArray)

      const last = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'))

      if (first >= 0 && last > first) {
        return JSON.parse(trimmed.slice(first, last + 1))
      }

      // Re-throw original parsing behavior when no extractable JSON is found
      return JSON.parse(trimmed)
    }
  }

  /**
   * Stream a chat completion
   */
  async *streamChatCompletion(
    options: ChatCompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || 'arcee-ai/trinity-large-preview:free'

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Education System',
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// Singleton instance
let clientInstance: OpenRouterClient | null = null

export function getOpenRouterClient(): OpenRouterClient {
  if (!clientInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set')
    }
    clientInstance = new OpenRouterClient(apiKey)
  }
  return clientInstance
}
