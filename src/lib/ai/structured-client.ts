/**
 * Structured AI Client
 * Provides bounded retries, timeouts, normalized errors, and step logging
 * v0.2 Engine Upgrade
 */

import { getAIClient } from './client'
import { addJobStep, type JobType } from '../jobs/store'
import type { ChatCompletionOptions, ChatCompletionResponse } from '../openrouter/client'

// Error codes for programmatic handling
export const AIErrorCode = {
  TIMEOUT: 'AI_TIMEOUT',
  RATE_LIMIT: 'AI_RATE_LIMIT',
  AUTH_ERROR: 'AI_AUTH_ERROR',
  INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  SCHEMA_VALIDATION_FAILED: 'AI_SCHEMA_VALIDATION_FAILED',
  NETWORK_ERROR: 'AI_NETWORK_ERROR',
  UNKNOWN: 'AI_UNKNOWN',
} as const

export type AIErrorCode = typeof AIErrorCode[keyof typeof AIErrorCode]

export interface AIError {
  code: AIErrorCode
  message: string
  cause?: Error
  retryable: boolean
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  timeoutMs: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 60000,
}

export interface StructuredAIOptions extends ChatCompletionOptions {
  jobId?: string
  stepName?: string
  retryConfig?: Partial<RetryConfig>
}

class StructuredAIClient {
  private client = getAIClient()
  private defaultConfig: RetryConfig

  constructor() {
    this.defaultConfig = {
      maxRetries: parseInt(process.env.AI_MAX_RETRIES ?? '3', 10),
      baseDelayMs: parseInt(process.env.AI_RETRY_BASE_DELAY_MS ?? '1000', 10),
      maxDelayMs: parseInt(process.env.AI_RETRY_MAX_DELAY_MS ?? '30000', 10),
      backoffMultiplier: parseInt(process.env.AI_RETRY_BACKOFF_MULTIPLIER ?? '2', 10),
      timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '60000', 10),
    }
  }

  /**
   * Make a chat completion with retries, timeout, and error normalization
   */
  async chatCompletion(options: StructuredAIOptions): Promise<ChatCompletionResponse> {
    const config = { ...this.defaultConfig, ...options.retryConfig }
    const startTime = Date.now()
    let lastError: AIError | null = null

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        // Log step start if jobId provided
        if (options.jobId && options.stepName) {
          await addJobStep(options.jobId, {
            stepName: options.stepName,
            status: 'IN_PROGRESS',
            message: `Attempt ${attempt + 1}/${config.maxRetries}`,
          })
        }

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(this.createError(AIErrorCode.TIMEOUT, `Request timed out after ${config.timeoutMs}ms`))
          }, config.timeoutMs)
        })

        // Race between completion and timeout
        const result = await Promise.race([
          this.client.chatCompletion(options),
          timeoutPromise,
        ])

        // Log step completion
        if (options.jobId && options.stepName) {
          await addJobStep(options.jobId, {
            stepName: options.stepName,
            status: 'COMPLETED',
            message: `Completed on attempt ${attempt + 1}`,
            durationMs: Date.now() - startTime,
          })
        }

        return result
      } catch (error) {
        lastError = this.normalizeError(error)
        
        // Log step failure
        if (options.jobId && options.stepName) {
          await addJobStep(options.jobId, {
            stepName: options.stepName,
            status: attempt < config.maxRetries - 1 ? 'PENDING' : 'FAILED',
            message: `Attempt ${attempt + 1} failed: ${lastError.message}`,
            data: { errorCode: lastError.code, retryable: lastError.retryable },
          })
        }

        // Don't retry if not retryable
        if (!lastError.retryable) {
          throw lastError
        }

        // Don't retry on last attempt
        if (attempt < config.maxRetries - 1) {
          const delayMs = Math.min(
            config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelayMs
          )
          await this.delay(delayMs)
        }
      }
    }

    throw lastError ?? this.createError(AIErrorCode.UNKNOWN, 'All retry attempts failed')
  }

  /**
   * Make a chat completion with schema validation and JSON repair
   */
  async chatCompletionWithSchema<T>(
    options: StructuredAIOptions,
    schema: { parse: (data: unknown) => T; safeParse?: (data: unknown) => { success: boolean; data?: T; error?: { message: string } } },
    maxRepairAttempts: number = 2
  ): Promise<T> {
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRepairAttempts; attempt++) {
      try {
        const response = await this.chatCompletion({
          ...options,
          response_format: { type: 'json_object' },
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
          throw new Error('No content in response')
        }

        const parsed = this.parseJsonFromContent(content)

        // Try Zod validation first if available
        if (schema.safeParse) {
          const result = schema.safeParse(parsed)
          if (result.success) {
            return result.data as T
          }
          throw new Error(`Schema validation failed: ${result.error?.message}`)
        }

        // Fall back to parse method
        return schema.parse(parsed)
      } catch (error) {
        lastError = error as Error

        // Add repair prompt for next attempt
        if (attempt < maxRepairAttempts - 1 && options.messages) {
          const repairMessage = this.createRepairPrompt(lastError.message, attempt + 1)
          options = {
            ...options,
            messages: [...options.messages, repairMessage],
          }

          // Log repair attempt
          if (options.jobId) {
            await addJobStep(options.jobId, {
              stepName: `${options.stepName || 'schema'}.repair`,
              status: 'IN_PROGRESS',
              message: `JSON repair attempt ${attempt + 1}`,
              data: { error: lastError.message },
            })
          }
        }
      }
    }

    // If we get here, all attempts failed
    const aiError = this.createError(
      AIErrorCode.SCHEMA_VALIDATION_FAILED,
      `Schema validation failed after ${maxRepairAttempts} attempts: ${lastError?.message}`,
      lastError ?? undefined
    )

    if (options.jobId) {
      await addJobStep(options.jobId, {
        stepName: `${options.stepName || 'schema'}.failed`,
        status: 'FAILED',
        message: aiError.message,
        data: { errorCode: aiError.code },
      })
    }

    throw aiError
  }

  /**
   * Create a repair prompt for JSON parsing failures
   */
  private createRepairPrompt(errorMessage: string, attempt: number) {
    return {
      role: 'user' as const,
      content: `Your previous response was invalid (attempt ${attempt}). Please fix it and provide valid JSON.

Error: ${errorMessage}

Requirements:
1. Return ONLY valid JSON (no markdown code blocks, no explanations)
2. Ensure all strings are properly quoted and terminated
3. Ensure all objects and arrays are properly closed
4. Do not include any text outside the JSON
5. Follow the schema exactly as specified in the original instructions

Return the corrected JSON only.`,
    }
  }

  /**
   * Normalize errors to AIError format
   */
  private normalizeError(error: unknown): AIError {
    if (this.isAIError(error)) {
      return error
    }

    const message = error instanceof Error ? error.message : String(error)

    // Classify error type
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return this.createError(AIErrorCode.TIMEOUT, message, error instanceof Error ? error : undefined)
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return this.createError(AIErrorCode.RATE_LIMIT, message, error instanceof Error ? error : undefined)
    }
    if (message.includes('401') || message.includes('403') || message.includes('auth')) {
      return this.createError(AIErrorCode.AUTH_ERROR, message, error instanceof Error ? error : undefined, false)
    }
    if (message.includes('network') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      return this.createError(AIErrorCode.NETWORK_ERROR, message, error instanceof Error ? error : undefined)
    }
    if (message.includes('JSON') || message.includes('parse')) {
      return this.createError(AIErrorCode.INVALID_RESPONSE, message, error instanceof Error ? error : undefined, false)
    }

    return this.createError(AIErrorCode.UNKNOWN, message, error instanceof Error ? error : undefined)
  }

  /**
   * Create an AIError
   */
  private createError(
    code: AIErrorCode,
    message: string,
    cause?: Error,
    retryable: boolean = true
  ): AIError {
    // Auth errors and parse errors are not retryable
    const isRetryable = retryable && !['AI_AUTH_ERROR', 'AI_INVALID_RESPONSE'].includes(code)

    return {
      code,
      message,
      cause,
      retryable: isRetryable,
    }
  }

  /**
   * Check if error is already an AIError
   */
  private isAIError(error: unknown): error is AIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'retryable' in error
    )
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Extract and parse JSON from model output content
   */
  private parseJsonFromContent(content: string): unknown {
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

      throw new Error('No valid JSON found in response')
    }
  }
}

// Singleton instance
let clientInstance: StructuredAIClient | null = null

export function getStructuredAIClient(): StructuredAIClient {
  if (!clientInstance) {
    clientInstance = new StructuredAIClient()
  }
  return clientInstance
}
