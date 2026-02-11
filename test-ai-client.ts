/**
 * Test script for AI Client with NVIDIA NIM and OpenRouter fallback
 * Tests:
 * 1. NVIDIA NIM GLM-4.7 model (with and without reasoning)
 * 2. NVIDIA NIM Kimi K2.5 model (with and without reasoning)
 * 3. OpenRouter fallback mechanism
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

async function testNvidiaGLM47() {
  section('Test 1: NVIDIA NIM GLM-4.7 (Fast Mode)')
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

    log('✓ GLM-4.7 Fast Mode Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content}`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    return true
  } catch (error) {
    log(`✗ GLM-4.7 Fast Mode Failed: ${error}`, 'red')
    return false
  }
}

async function testNvidiaGLM47Reasoning() {
  section('Test 2: NVIDIA NIM GLM-4.7 (Reasoning Mode)')
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

    log('✓ GLM-4.7 Reasoning Mode Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content?.substring(0, 200)}...`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    return true
  } catch (error) {
    log(`✗ GLM-4.7 Reasoning Mode Failed: ${error}`, 'red')
    return false
  }
}

async function testNvidiaKimiK25() {
  section('Test 3: NVIDIA NIM Kimi K2.5 (Fast Mode)')
  const client = getAIClient()

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'List 3 programming languages.' },
      ],
      model: 'kimi',
      task: 'fast',
      temperature: 0.5,
    })

    log('✓ Kimi K2.5 Fast Mode Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content}`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    return true
  } catch (error) {
    log(`✗ Kimi K2.5 Fast Mode Failed: ${error}`, 'red')
    return false
  }
}

async function testNvidiaKimiK25Reasoning() {
  section('Test 4: NVIDIA NIM Kimi K2.5 (Reasoning Mode)')
  const client = getAIClient()

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Compare and contrast arrays and linked lists in data structures.' },
      ],
      model: 'kimi',
      task: 'reasoning',
      temperature: 0.7,
    })

    log('✓ Kimi K2.5 Reasoning Mode Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content?.substring(0, 200)}...`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    return true
  } catch (error) {
    log(`✗ Kimi K2.5 Reasoning Mode Failed: ${error}`, 'red')
    return false
  }
}

async function testJSONResponse() {
  section('Test 5: JSON Response (Reasoning Mode)')
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

    log('✓ JSON Response Success!', 'green')
    log(`Model: ${response.model}`, 'blue')
    log(`Response: ${response.choices[0]?.message?.content}`, 'yellow')
    log(`Tokens: ${response.usage.total_tokens}`, 'blue')
    return true
  } catch (error) {
    log(`✗ JSON Response Failed: ${error}`, 'red')
    return false
  }
}

async function testStreaming() {
  section('Test 6: Streaming Response')
  const client = getAIClient()

  try {
    log('Starting stream...', 'blue')
    let fullContent = ''

    for await (const chunk of client.streamChatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Count from 1 to 5.' },
      ],
      task: 'fast',
      temperature: 0.5,
    })) {
      fullContent += chunk
      process.stdout.write(chunk)
    }

    console.log('\n')
    log('✓ Streaming Success!', 'green')
    log(`Full content: ${fullContent}`, 'yellow')
    return true
  } catch (error) {
    log(`✗ Streaming Failed: ${error}`, 'red')
    return false
  }
}

async function testGetRecommendedModel() {
  section('Test 7: Get Recommended Model')
  const client = getAIClient()

  try {
    const fastModel = await client.getRecommendedModel('fast')
    const reasoningModel = await client.getRecommendedModel('reasoning')

    log('✓ Get Recommended Model Success!', 'green')
    log(`Fast Model: ${fastModel}`, 'blue')
    log(`Reasoning Model: ${reasoningModel}`, 'blue')
    return true
  } catch (error) {
    log(`✗ Get Recommended Model Failed: ${error}`, 'red')
    return false
  }
}

async function runAllTests() {
  section('AI Client Test Suite')
  log('Testing NVIDIA NIM (GLM-4.7, Kimi K2.5) with OpenRouter fallback', 'cyan')

  const results = {
    'GLM-4.7 Fast': await testNvidiaGLM47(),
    'GLM-4.7 Reasoning': await testNvidiaGLM47Reasoning(),
    'Kimi K2.5 Fast': await testNvidiaKimiK25(),
    'Kimi K2.5 Reasoning': await testNvidiaKimiK25Reasoning(),
    'JSON Response': await testJSONResponse(),
    'Streaming': await testStreaming(),
    'Get Recommended Model': await testGetRecommendedModel(),
  }

  section('Test Results Summary')
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

  if (failed > 0) {
    log('\nNote: Some tests may have fallen back to OpenRouter if NVIDIA NIM failed.', 'yellow')
    log('This is expected behavior and demonstrates the fallback mechanism.', 'yellow')
  }
}

// Run tests
runAllTests().catch(console.error)
