/**
 * Unified AI Client
 * Primary: NVIDIA NIM (GLM-4.7, Kimi K2.5 with/without reasoning)
 * Fallback: OpenRouter after retries
 */

// Re-export types from OpenRouter client for compatibility
export type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResponse,
} from '../openrouter/client'

import type {
  ChatCompletionOptions,
  ChatCompletionResponse,
} from '../openrouter/client'
import { getOpenRouterClient } from '../openrouter/client'

// NVIDIA NIM Configuration
const NVIDIA_NIM_API_URL = 'https://integrate.api.nvidia.com/v1'

// Model configurations for NVIDIA NIM
// Correct model IDs from NVIDIA NIM API documentation
const NVIDIA_MODELS = {
  // GLM-4.7 models (z-ai/glm4.7 - same model, reasoning controlled via chat_template_kwargs)
  GLM_47: {
    id: 'z-ai/glm4.7',
    name: 'GLM-4.7',
    supportsReasoning: true,
    contextLength: 128000,
    reasoningConfig: { enable_thinking: false, clear_thinking: true },
  },
  GLM_47_REASONING: {
    id: 'z-ai/glm4.7',
    name: 'GLM-4.7 Reasoning',
    supportsReasoning: true,
    contextLength: 128000,
    reasoningConfig: { enable_thinking: true, clear_thinking: false },
  },
  // Kimi K2.5 models (moonshotai/kimi-k2.5 - same model, reasoning controlled via chat_template_kwargs)
  KIMI_K25: {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    supportsReasoning: true,
    contextLength: 256000,
    reasoningConfig: { thinking: false },
  },
  KIMI_K25_REASONING: {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5 Reasoning',
    supportsReasoning: true,
    contextLength: 256000,
    reasoningConfig: { thinking: true },
  },
} as const

type NvidiaModelKey = keyof typeof NVIDIA_MODELS

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

class UnifiedAIClient {
  private nvidiaApiKey: string | undefined
  private retryConfig: RetryConfig
  private openRouterClient = getOpenRouterClient()

  constructor() {
    this.nvidiaApiKey = process.env.NVIDIA_NIM_API_KEY
    this.retryConfig = {
      maxRetries: parseInt(process.env.AI_MAX_RETRIES ?? '3', 10),
      baseDelayMs: parseInt(process.env.AI_RETRY_BASE_DELAY_MS ?? '1000', 10),
      maxDelayMs: parseInt(process.env.AI_RETRY_MAX_DELAY_MS ?? '10000', 10),
      backoffMultiplier: parseInt(process.env.AI_RETRY_BACKOFF_MULTIPLIER ?? '2', 10),
    }
  }

  /**
   * Select the appropriate NVIDIA model based on task requirements
   */
  private selectModelForRequest(options: ChatCompletionOptions): string {
    const task = options.task ?? 'reasoning'
    const preferReasoning = task === 'reasoning' || options.response_format?.type === 'json_object'

    // Check if specific model is requested
    if (options.model) {
      // Map common model names to NVIDIA models
      const modelMap: Record<string, string> = {
        'glm-4.7': preferReasoning
          ? NVIDIA_MODELS.GLM_47_REASONING.id
          : NVIDIA_MODELS.GLM_47.id,
        'glm': preferReasoning
          ? NVIDIA_MODELS.GLM_47_REASONING.id
          : NVIDIA_MODELS.GLM_47.id,
        'kimi': preferReasoning
          ? NVIDIA_MODELS.KIMI_K25_REASONING.id
          : NVIDIA_MODELS.KIMI_K25.id,
        'kimi-k2.5': preferReasoning
          ? NVIDIA_MODELS.KIMI_K25_REASONING.id
          : NVIDIA_MODELS.KIMI_K25.id,
      }

      const mappedModel = modelMap[options.model.toLowerCase()]
      if (mappedModel) {
        return mappedModel
      }
    }

    // Default model selection based on task
    if (preferReasoning) {
      // For reasoning tasks, prefer GLM-4.7 with reasoning
      return process.env.PREFERRED_REASONING_MODEL === 'kimi'
        ? NVIDIA_MODELS.KIMI_K25_REASONING.id
        : NVIDIA_MODELS.GLM_47_REASONING.id
    } else {
      // For fast tasks, prefer Kimi K2.5 without reasoning
      return process.env.PREFERRED_FAST_MODEL === 'glm'
        ? NVIDIA_MODELS.GLM_47.id
        : NVIDIA_MODELS.KIMI_K25.id
    }
  }

  /**
   * Delay execution for retry backoff
   */
  private async delay(attempt: number): Promise<void> {
    const delayMs = Math.min(
      this.retryConfig.baseDelayMs *
        Math.pow(this.retryConfig.backoffMultiplier, attempt),
      this.retryConfig.maxDelayMs
    )
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  /**
   * Get model config with reasoning settings
   */
  private getModelConfig(options: ChatCompletionOptions): { id: string; reasoningConfig: Record<string, boolean> } {
    const task = options.task ?? 'reasoning'
    const preferReasoning = task === 'reasoning' || options.response_format?.type === 'json_object'

    // Check if specific model is requested
    if (options.model) {
      const modelLower = options.model.toLowerCase()
      if (modelLower.includes('glm')) {
        return preferReasoning ? 
          { id: NVIDIA_MODELS.GLM_47_REASONING.id, reasoningConfig: NVIDIA_MODELS.GLM_47_REASONING.reasoningConfig } :
          { id: NVIDIA_MODELS.GLM_47.id, reasoningConfig: NVIDIA_MODELS.GLM_47.reasoningConfig }
      }
      if (modelLower.includes('kimi')) {
        return preferReasoning ? 
          { id: NVIDIA_MODELS.KIMI_K25_REASONING.id, reasoningConfig: NVIDIA_MODELS.KIMI_K25_REASONING.reasoningConfig } :
          { id: NVIDIA_MODELS.KIMI_K25.id, reasoningConfig: NVIDIA_MODELS.KIMI_K25.reasoningConfig }
      }
    }

    // Default model selection based on task
    if (preferReasoning) {
      return process.env.PREFERRED_REASONING_MODEL === 'kimi'
        ? { id: NVIDIA_MODELS.KIMI_K25_REASONING.id, reasoningConfig: NVIDIA_MODELS.KIMI_K25_REASONING.reasoningConfig }
        : { id: NVIDIA_MODELS.GLM_47_REASONING.id, reasoningConfig: NVIDIA_MODELS.GLM_47_REASONING.reasoningConfig }
    } else {
      return process.env.PREFERRED_FAST_MODEL === 'glm'
        ? { id: NVIDIA_MODELS.GLM_47.id, reasoningConfig: NVIDIA_MODELS.GLM_47.reasoningConfig }
        : { id: NVIDIA_MODELS.KIMI_K25.id, reasoningConfig: NVIDIA_MODELS.KIMI_K25.reasoningConfig }
    }
  }

  /**
   * Make a request to NVIDIA NIM API
   */
  private async nvidiaChatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    if (!this.nvidiaApiKey) {
      throw new Error('NVIDIA_NIM_API_KEY is not set')
    }

    const { id: model, reasoningConfig } = this.getModelConfig(options)
    const startedAt = Date.now()

    const payloadMessages = options.disableSystemRole
      ? options.messages.map((m, index) =>
          m.role === 'system'
            ? {
                role: 'user' as const,
                content: `Instruction${index + 1}:\n${m.content}`,
              }
            : m
        )
      : options.messages

    const response = await fetch(`${NVIDIA_NIM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.nvidiaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: payloadMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 16384,
        tools: options.tools,
        response_format: options.response_format,
        stream: options.stream ?? false,
        chat_template_kwargs: reasoningConfig,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `NVIDIA NIM API error (${response.status}): ${response.statusText} - ${errorText}`
      )
    }

    const data = await response.json()

    // Transform NVIDIA response to match OpenRouter format
    const transformedResponse: ChatCompletionResponse = {
      id: data.id ?? `nvidia-${Date.now()}`,
      model: data.model ?? model,
      choices:
        data.choices?.map((choice: any, index: number) => ({
          index,
          message: {
            role: choice.message?.role ?? 'assistant',
            content: choice.message?.content ?? null,
            reasoning: choice.message?.reasoning_content ?? undefined,
            tool_calls: choice.message?.tool_calls ?? undefined,
          },
          finish_reason: choice.finish_reason ?? 'stop',
        })) ?? [],
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
    }

    const latencyMs = Date.now() - startedAt
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[NVIDIA NIM] model=${model} tokens=${transformedResponse.usage.total_tokens} latency=${latencyMs}ms`
      )
    }

    return transformedResponse
  }

  /**
   * Make a chat completion request
   * Primary: NVIDIA NIM
   * Fallback: OpenRouter after retries
   */
  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    // If no NVIDIA API key, go straight to OpenRouter
    if (!this.nvidiaApiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[UnifiedAI] No NVIDIA API key, using OpenRouter')
      }
      return this.openRouterClient.chatCompletion(options)
    }

    // Try NVIDIA NIM first with retries
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.nvidiaChatCompletion(options)
      } catch (error) {
        lastError = error as Error

        if (process.env.NODE_ENV !== 'production') {
          console.error(
            `[UnifiedAI] NVIDIA NIM attempt ${attempt + 1} failed:`,
            lastError.message
          )
        }

        // Don't retry on authentication errors
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          break
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.retryConfig.maxRetries - 1) {
          await this.delay(attempt)
        }
      }
    }

    // Fallback to OpenRouter
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[UnifiedAI] Falling back to OpenRouter after ${this.retryConfig.maxRetries} failed attempts`
      )
    }

    try {
      return await this.openRouterClient.chatCompletion(options)
    } catch (fallbackError) {
      // If OpenRouter also fails, throw the original error
      throw lastError ?? (fallbackError as Error)
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
          throw new Error(
            'API returned no choices in response. This may indicate an invalid API key or model.'
          )
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
            schema?.type === 'array' ? 'Return a JSON ARRAY only.' : 'Return a JSON OBJECT only.'

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
   * Stream a chat completion
   */
  async *streamChatCompletion(
    options: ChatCompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    // For streaming, try NVIDIA first, then fallback to OpenRouter
    if (this.nvidiaApiKey) {
      try {
        const { id: model, reasoningConfig } = this.getModelConfig(options)

        const payloadMessages = options.disableSystemRole
          ? options.messages.map((m, index) =>
              m.role === 'system'
                ? {
                    role: 'user' as const,
                    content: `Instruction${index + 1}:\n${m.content}`,
                  }
                : m
            )
          : options.messages

        const response = await fetch(`${NVIDIA_NIM_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.nvidiaApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: payloadMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 16384,
            stream: true,
            chat_template_kwargs: reasoningConfig,
          }),
        })

        if (response.ok) {
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

          return
        }
      } catch (error) {
        console.error('[UnifiedAI] NVIDIA streaming failed, falling back to OpenRouter:', error)
      }
    }

    // Fallback to OpenRouter streaming
    yield* this.openRouterClient.streamChatCompletion(options)
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
   * Select the best model for a given task
   * Returns the NVIDIA model that would be used
   */
  async getRecommendedModel(task: 'fast' | 'reasoning'): Promise<string> {
    const preferReasoning = task === 'reasoning'

    if (preferReasoning) {
      return process.env.PREFERRED_REASONING_MODEL === 'kimi'
        ? NVIDIA_MODELS.KIMI_K25_REASONING.id
        : NVIDIA_MODELS.GLM_47_REASONING.id
    } else {
      return process.env.PREFERRED_FAST_MODEL === 'glm'
        ? NVIDIA_MODELS.GLM_47.id
        : NVIDIA_MODELS.KIMI_K25.id
    }
  }
}

// Singleton instance
let clientInstance: UnifiedAIClient | null = null

export function getAIClient(): UnifiedAIClient {
  if (!clientInstance) {
    clientInstance = new UnifiedAIClient()
  }
  return clientInstance
}

// Re-export for backward compatibility
export { getAIClient as getOpenRouterClient }
