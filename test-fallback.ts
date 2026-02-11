/**
 * Test script for OpenRouter fallback mechanism
 * This test verifies that the system falls back to OpenRouter when NVIDIA NIM fails
 */

import 'dotenv/config'
import { getAIClient } from './src/lib/ai/client'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

async function testOpenRouterFallback() {
  section('Test: OpenRouter Fallback Mechanism')
  
  // Temporarily disable NVIDIA API key to force fallback
  const originalNvidiaKey = process.env.NVIDIA_NIM_API_KEY
  delete process.env.NVIDIA_NIM_API_KEY
  
  log('NVIDIA_NIM_API_KEY temporarily disabled to test fallback', 'yellow')
  
  const client = getAIClient()

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is 2 + 2? Answer in one word.' },
      ],
      task: 'fast',
      temperature: 0.5,
    })

    log('✓ OpenRouter Fallback Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content}`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return true
  } catch (error) {
    log(`✗ OpenRouter Fallback Failed: ${error}`, 'red')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return false
  }
}

async function testOpenRouterReasoning() {
  section('Test: OpenRouter Reasoning Mode')
  
  // Temporarily disable NVIDIA API key to force fallback
  const originalNvidiaKey = process.env.NVIDIA_NIM_API_KEY
  delete process.env.NVIDIA_NIM_API_KEY
  
  log('NVIDIA_NIM_API_KEY temporarily disabled to test fallback', 'yellow')
  
  const client = getAIClient()

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain the concept of recursion in programming with a simple example.' },
      ],
      task: 'reasoning',
      temperature: 0.7,
    })

    log('✓ OpenRouter Reasoning Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content?.substring(0, 200)}...`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return true
  } catch (error) {
    log(`✗ OpenRouter Reasoning Failed: ${error}`, 'red')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return false
  }
}

async function testOpenRouterJSON() {
  section('Test: OpenRouter JSON Response')
  
  // Temporarily disable NVIDIA API key to force fallback
  const originalNvidiaKey = process.env.NVIDIA_NIM_API_KEY
  delete process.env.NVIDIA_NIM_API_KEY
  
  log('NVIDIA_NIM_API_KEY temporarily disabled to test fallback', 'yellow')
  
  const client = getAIClient()

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns JSON.' },
        { role: 'user', content: 'Return a JSON object with fields: name, age, city. Use sample data.' },
      ],
      task: 'reasoning',
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    log('✓ OpenRouter JSON Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content}`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return true
  } catch (error) {
    log(`✗ OpenRouter JSON Failed: ${error}`, 'red')
    
    // Restore NVIDIA API key
    process.env.NVIDIA_NIM_API_KEY = originalNvidiaKey
    return false
  }
}

async function runFallbackTests() {
  section('OpenRouter Fallback Test Suite')
  log('Testing fallback to OpenRouter when NVIDIA NIM is unavailable', 'cyan')

  const results = {
    'OpenRouter Fallback': await testOpenRouterFallback(),
    'OpenRouter Reasoning': await testOpenRouterReasoning(),
    'OpenRouter JSON': await testOpenRouterJSON(),
  }

  section('Fallback Test Results Summary')
  let passed = 0
  let failed = 0

  for (const [test, result] of Object.entries(results)) {
    if (result) {
      log(`✓ ${test}`, 'green')
      passed++
    } else {
      log(`✗ ${test}`, 'red')
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`, passed === Object.keys(results).length ? 'green' : 'yellow')
  console.log('='.repeat(60))
}

// Run tests
runFallbackTests().catch(console.error)
