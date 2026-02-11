/**
 * Parallel AI Client
 * Executes tasks on both NVIDIA NIM and OpenRouter simultaneously
 * Combines results for optimal performance
 */

import type {
  ChatCompletionOptions,
  ChatCompletionResponse,
} from '../openrouter/client'
import { getOpenRouterClient } from '../openrouter/client'

// NVIDIA NIM Configuration
const NVIDIA_NIM_API_URL = 'https://integrate.api.nvidia.com/v1'

// Model configurations for NVIDIA NIM
const NVIDIA_MODELS = {
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

export type TaskPriority = 'fast' | 'standard' | 'reasoning' | 'large-context' | 'complex'

export interface ParallelExecutionResult {
  nvidiaResult?: ChatCompletionResponse
  openRouterResult?: ChatCompletionResponse
  selectedResult: ChatCompletionResponse
  source: 'nvidia' | 'openrouter' | 'combined'
  executionTimeMs: number
}

export interface ParallelOptions extends ChatCompletionOptions {
  /**
   * Priority level for task routing
   * - fast: Use OpenRouter for quick responses
   * - reasoning: Use NVIDIA NIM for complex reasoning
   * - complex: Use both APIs and combine results
   */
  priority?: TaskPriority
  
  /**
   * Whether to wait for both APIs or return first available
   */
  waitForBoth?: boolean
  
  /**
   * Timeout for each API call in milliseconds
   */
  timeoutMs?: number
}

class ParallelAIClient {
  private nvidiaApiKey: string | undefined
  private openRouterClient = getOpenRouterClient()

  constructor() {
    this.nvidiaApiKey = process.env.NVIDIA_NIM_API_KEY
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
    options: ChatCompletionOptions,
    timeoutMs: number = 30000
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

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
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
          stream: false,
          chat_template_kwargs: reasoningConfig,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

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
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  /**
   * Make a request to OpenRouter API
   */
  private async openRouterChatCompletion(
    options: ChatCompletionOptions,
    timeoutMs: number = 30000
  ): Promise<ChatCompletionResponse> {
    const startedAt = Date.now()

    const response = await this.openRouterClient.chatCompletion({
      ...options,
      timeoutMs,
    })

    const latencyMs = Date.now() - startedAt
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[OpenRouter] model=${response.model} tokens=${response.usage?.total_tokens ?? 'n/a'} latency=${latencyMs}ms`
      )
    }

    return response
  }

  /**
   * Combine results from both APIs
   */
  private combineResults(
    nvidiaResult: ChatCompletionResponse,
    openRouterResult: ChatCompletionResponse
  ): ChatCompletionResponse {
    // Strategy: Use NVIDIA result for reasoning content, OpenRouter for speed
    // Combine the best of both
    
    const nvidiaContent = nvidiaResult.choices[0]?.message?.content || ''
    const openRouterContent = openRouterResult.choices[0]?.message?.content || ''
    
    // Prefer NVIDIA result for complex tasks (has reasoning)
    const nvidiaReasoning = nvidiaResult.choices[0]?.message?.reasoning
    
    if (nvidiaReasoning && nvidiaContent) {
      // NVIDIA has reasoning - use it
      return nvidiaResult
    }
    
    // If NVIDIA content is longer and more detailed, use it
    if (nvidiaContent.length > openRouterContent.length * 1.5) {
      return nvidiaResult
    }
    
    // Otherwise use OpenRouter (faster)
    return openRouterResult
  }

  /**
   * Execute chat completion with parallel API calls
   */
  async chatCompletion(options: ParallelOptions): Promise<ParallelExecutionResult> {
    const priority = options.priority ?? 'reasoning'
    const waitForBoth = options.waitForBoth ?? false
    const timeoutMs = options.timeoutMs ?? 30000
    const startedAt = Date.now()

    // For fast priority, use trinity-mini from OpenRouter
    if (priority === 'fast') {
      try {
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'arcee-ai/trinity-mini:free' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      } catch (error) {
        // Fallback to trinity-large if mini fails
        try {
          const openRouterResult = await this.openRouterChatCompletion(
            { ...options, model: 'arcee-ai/trinity-large-preview:free' },
            timeoutMs
          )
          return {
            openRouterResult,
            selectedResult: openRouterResult,
            source: 'openrouter',
            executionTimeMs: Date.now() - startedAt,
          }
        } catch (largeError) {
          // Final fallback to NVIDIA
          if (this.nvidiaApiKey) {
            const nvidiaResult = await this.nvidiaChatCompletion(options, timeoutMs)
            return {
              nvidiaResult,
              selectedResult: nvidiaResult,
              source: 'nvidia',
              executionTimeMs: Date.now() - startedAt,
            }
          }
          throw error
        }
      }
    }

    // For standard priority, use trinity-large from OpenRouter
    if (priority === 'standard') {
      try {
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'arcee-ai/trinity-large-preview:free' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      } catch (error) {
        // Fallback to trinity-mini if large fails
        try {
          const openRouterResult = await this.openRouterChatCompletion(
            { ...options, model: 'arcee-ai/trinity-mini:free' },
            timeoutMs
          )
          return {
            openRouterResult,
            selectedResult: openRouterResult,
            source: 'openrouter',
            executionTimeMs: Date.now() - startedAt,
          }
        } catch (miniError) {
          // Final fallback to NVIDIA
          if (this.nvidiaApiKey) {
            const nvidiaResult = await this.nvidiaChatCompletion(options, timeoutMs)
            return {
              nvidiaResult,
              selectedResult: nvidiaResult,
              source: 'nvidia',
              executionTimeMs: Date.now() - startedAt,
            }
          }
          throw error
        }
      }
    }

    // For reasoning priority, use GLM-4.7 from NVIDIA NIM
    if (priority === 'reasoning') {
      if (!this.nvidiaApiKey) {
        // Fallback to OpenRouter if no NVIDIA key
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'trinity-large' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      }

      try {
        const nvidiaResult = await this.nvidiaChatCompletion(
          { ...options, model: 'glm-4.7', task: 'reasoning' },
          timeoutMs
        )
        return {
          nvidiaResult,
          selectedResult: nvidiaResult,
          source: 'nvidia',
          executionTimeMs: Date.now() - startedAt,
        }
      } catch (error) {
        // Fallback to OpenRouter
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'arcee-ai/trinity-large-preview:free' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      }
    }

    // For large-context priority, use Kimi K2.5 from NVIDIA NIM
    if (priority === 'large-context') {
      if (!this.nvidiaApiKey) {
        // Fallback to OpenRouter if no NVIDIA key
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'arcee-ai/trinity-large-preview:free' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      }

      try {
        const nvidiaResult = await this.nvidiaChatCompletion(
          { ...options, model: 'kimi', task: 'reasoning' },
          timeoutMs
        )
        return {
          nvidiaResult,
          selectedResult: nvidiaResult,
          source: 'nvidia',
          executionTimeMs: Date.now() - startedAt,
        }
      } catch (error) {
        // Fallback to OpenRouter
        const openRouterResult = await this.openRouterChatCompletion(
          { ...options, model: 'arcee-ai/trinity-large-preview:free' },
          timeoutMs
        )
        return {
          openRouterResult,
          selectedResult: openRouterResult,
          source: 'openrouter',
          executionTimeMs: Date.now() - startedAt,
        }
      }
    }

    // For complex priority, use both APIs in parallel
    const promises: Promise<{ source: 'nvidia' | 'openrouter'; result: ChatCompletionResponse }>[] = []

    // Add NVIDIA promise (use GLM-4.7 for complex reasoning)
    if (this.nvidiaApiKey) {
      promises.push(
        this.nvidiaChatCompletion(
          { ...options, model: 'glm-4.7', task: 'reasoning' },
          timeoutMs
        ).then(result => ({ source: 'nvidia' as const, result }))
          .catch(error => {
            console.error('[ParallelAI] GLM-4.7 failed:', error)
            throw error
          })
      )
    }

    // Add OpenRouter promise (use trinity-large)
    promises.push(
      this.openRouterChatCompletion(
        { ...options, model: 'arcee-ai/trinity-large-preview:free' },
        timeoutMs
      ).then(result => ({ source: 'openrouter' as const, result }))
        .catch(error => {
          console.error('[ParallelAI] OpenRouter failed:', error)
          throw error
        })
    )

    if (waitForBoth) {
      // Wait for both APIs to complete
      try {
        const results = await Promise.all(promises)
        const nvidiaResult = results.find(r => r.source === 'nvidia')?.result
        const openRouterResult = results.find(r => r.source === 'openrouter')?.result

        if (nvidiaResult && openRouterResult) {
          const combined = this.combineResults(nvidiaResult, openRouterResult)
          return {
            nvidiaResult,
            openRouterResult,
            selectedResult: combined,
            source: 'combined',
            executionTimeMs: Date.now() - startedAt,
          }
        } else if (nvidiaResult) {
          return {
            nvidiaResult,
            selectedResult: nvidiaResult,
            source: 'nvidia',
            executionTimeMs: Date.now() - startedAt,
          }
        } else {
          return {
            openRouterResult: openRouterResult!,
            selectedResult: openRouterResult!,
            source: 'openrouter',
            executionTimeMs: Date.now() - startedAt,
          }
        }
      } catch (error) {
        // If both fail, throw the error
        throw error
      }
    } else {
      // Return first successful result
      try {
        const firstResult = await Promise.race(promises)
        if (firstResult.source === 'nvidia') {
          return {
            nvidiaResult: firstResult.result,
            selectedResult: firstResult.result,
            source: 'nvidia',
            executionTimeMs: Date.now() - startedAt,
          }
        } else {
          return {
            openRouterResult: firstResult.result,
            selectedResult: firstResult.result,
            source: 'openrouter',
            executionTimeMs: Date.now() - startedAt,
          }
        }
      } catch (error) {
        // If first fails, try the other
        const remainingPromises = promises.filter(p =>
          p !== Promise.reject(error)
        )

        if (remainingPromises.length > 0) {
          try {
            const fallbackResult = await remainingPromises[0]
            if (fallbackResult.source === 'nvidia') {
              return {
                nvidiaResult: fallbackResult.result,
                selectedResult: fallbackResult.result,
                source: 'nvidia',
                executionTimeMs: Date.now() - startedAt,
              }
            } else {
              return {
                openRouterResult: fallbackResult.result,
                selectedResult: fallbackResult.result,
                source: 'openrouter',
                executionTimeMs: Date.now() - startedAt,
              }
            }
          } catch (fallbackError) {
            throw error
          }
        }
        throw error
      }
    }
  }

  /**
   * Make a chat completion request with schema validation
   * Uses NVIDIA NIM for complex schema validation tasks
   */
  async chatCompletionWithSchema<T>(
    options: ParallelOptions,
    schema: any,
    maxRetries: number = 3
  ): Promise<T> {
    // For schema validation, always use NVIDIA NIM first
    const nvidiaOptions: ParallelOptions = {
      ...options,
      priority: 'reasoning',
    }

    let lastError: Error | null = null
    const retryMessages = [...options.messages]

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const enforceJsonObject = schema?.type !== 'array'

        const result = await this.chatCompletion({
          ...nvidiaOptions,
          messages: retryMessages,
          response_format: enforceJsonObject ? { type: 'json_object' } : undefined,
        })

        // Check if response has expected structure
        if (!result.selectedResult.choices || result.selectedResult.choices.length === 0) {
          throw new Error(
            'API returned no choices in response. This may indicate an invalid API key or model.'
          )
        }

        const message = result.selectedResult.choices[0]?.message as any
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
}

// Singleton instance
let clientInstance: ParallelAIClient | null = null

export function getParallelAIClient(): ParallelAIClient {
  if (!clientInstance) {
    clientInstance = new ParallelAIClient()
  }
  return clientInstance
}
