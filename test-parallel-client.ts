/**
 * Test Parallel AI Client
 * Verifies that the parallel execution system works correctly
 */

import 'dotenv/config'
import { getParallelAIClient } from './src/lib/ai/parallel-client'

async function testFastPriority() {
  console.log('\n=== Testing Fast Priority (OpenRouter) ===')
  const client = getParallelAIClient()
  
  const result = await client.chatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'What is 2 + 2? Answer in one word.',
      },
    ],
    temperature: 0.7,
    priority: 'fast',
  })

  console.log('Source:', result.source)
  console.log('Execution Time:', result.executionTimeMs, 'ms')
  console.log('Response:', result.selectedResult.choices[0]?.message?.content)
  console.log('Model:', result.selectedResult.model)
}

async function testReasoningPriority() {
  console.log('\n=== Testing Reasoning Priority (NVIDIA NIM) ===')
  const client = getParallelAIClient()
  
  const result = await client.chatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'Explain the concept of recursion in programming with a simple example.',
      },
    ],
    temperature: 0.7,
    priority: 'reasoning',
  })

  console.log('Source:', result.source)
  console.log('Execution Time:', result.executionTimeMs, 'ms')
  console.log('Response:', result.selectedResult.choices[0]?.message?.content?.substring(0, 200) + '...')
  console.log('Model:', result.selectedResult.model)
}

async function testComplexPriority() {
  console.log('\n=== Testing Complex Priority (Both APIs) ===')
  const client = getParallelAIClient()
  
  const result = await client.chatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'Write a short poem about artificial intelligence.',
      },
    ],
    temperature: 0.8,
    priority: 'complex',
    waitForBoth: false, // Return first available
  })

  console.log('Source:', result.source)
  console.log('Execution Time:', result.executionTimeMs, 'ms')
  console.log('Response:', result.selectedResult.choices[0]?.message?.content?.substring(0, 200) + '...')
  console.log('Model:', result.selectedResult.model)
  
  if (result.nvidiaResult) {
    console.log('NVIDIA Result Available: Yes')
  }
  if (result.openRouterResult) {
    console.log('OpenRouter Result Available: Yes')
  }
}

async function testSchemaValidation() {
  console.log('\n=== Testing Schema Validation (NVIDIA NIM) ===')
  const client = getParallelAIClient()
  
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      items: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'items'],
  }

  const result = await client.chatCompletionWithSchema(
    {
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Create a shopping list with a title and 3 items. Return as JSON.',
        },
      ],
      temperature: 0.7,
      priority: 'reasoning',
    },
    schema
  )

  console.log('Result:', JSON.stringify(result, null, 2))
}

async function testTutorAgent() {
  console.log('\n=== Testing Tutor Agent (Fast Priority) ===')
  const { getTutorAgent } = await import('./src/lib/agents/tutor')
  const tutor = getTutorAgent()
  
  const response = await tutor.answerQuestion(
    'What is the capital of France?',
    'Geography'
  )
  
  console.log('Tutor Response:', response.substring(0, 200) + '...')
}

async function runAllTests() {
  console.log('Starting Parallel AI Client Tests...')
  console.log('=====================================')
  
  try {
    await testFastPriority()
    await testReasoningPriority()
    await testComplexPriority()
    await testSchemaValidation()
    await testTutorAgent()
    
    console.log('\n=====================================')
    console.log('All tests completed successfully!')
  } catch (error) {
    console.error('\nTest failed:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()
