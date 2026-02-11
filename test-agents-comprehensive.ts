/**
 * Test All Agents with Parallel AI Client
 * Generates content and tests each agent
 */

import 'dotenv/config'
import { getTutorAgent } from './src/lib/agents/tutor'
import { getCurriculumArchitectAgent } from './src/lib/agents/curriculum-architect'
import { getExerciseGeneratorAgent } from './src/lib/agents/exercise-generator'
import type { LessonBlueprint } from './src/lib/schemas'

async function testTutorAgent() {
  console.log('\n==========================================')
  console.log('Testing Tutor Agent (Fast Priority)')
  console.log('==========================================')
  
  const tutor = getTutorAgent()
  
  // Test 1: Answer a question
  console.log('\n1. Testing answerQuestion...')
  const answer1 = await tutor.answerQuestion(
    'What is the difference between a list and a tuple in Python?',
    'Python Programming'
  )
  console.log('Response:', answer1.substring(0, 300) + '...')
  
  // Test 2: Explain a concept
  console.log('\n2. Testing explainConcept...')
  const explanation = await tutor.explainConcept(
    'Recursion',
    'Python Programming',
    'intermediate'
  )
  console.log('Explanation:', explanation.substring(0, 300) + '...')
  
  // Test 3: Provide exercise feedback
  console.log('\n3. Testing provideExerciseFeedback...')
  const feedback = await tutor.provideExerciseFeedback(
    'What is 2 + 2?',
    '5',
    '4',
    '2 + 2 equals 4, not 5.'
  )
  console.log('Feedback:', feedback.substring(0, 300) + '...')
  
  // Test 4: Provide study tips
  console.log('\n4. Testing provideStudyTips...')
  const tips = await tutor.provideStudyTips(
    'Python Functions',
    'intermediate',
    60
  )
  console.log('Tips:', tips.substring(0, 300) + '...')
}

async function testCurriculumArchitectAgent() {
  console.log('\n==========================================')
  console.log('Testing Curriculum Architect (NVIDIA NIM)')
  console.log('==========================================')
  
  const architect = getCurriculumArchitectAgent()
  
  // Test 1: Generate a program blueprint
  console.log('\n1. Testing generateProgram...')
  const profile = {
    topic: 'Python Programming',
    currentLevel: 'beginner',
    goalLevel: 'intermediate',
    targetDate: '2025-06-01',
    hoursPerDay: 2,
    hoursPerWeek: 14,
    pacePreference: 'normal' as const,
    learningPreferences: {
      videoPreference: 60,
      readingPreference: 30,
      speakingFocus: false,
      writingFocus: true,
      listeningFocus: false,
    },
    constraints: {
      device: 'desktop',
    },
    contentLanguage: 'English',
    instructionLanguage: 'English',
    strictTargetLanguage: false,
    additionalNotes: 'I want to focus on practical projects',
  }
  
  const program = await architect.generateProgram(profile)
  console.log('Program Title:', program.title)
  console.log('Description:', program.description.substring(0, 200) + '...')
  console.log('Modules:', program.modules.length)
  console.log('Total Lessons:', program.totalLessons)
  console.log('Total Hours:', program.totalHours)
  console.log('Estimated Weeks:', program.estimatedWeeks)
  
  // Test 2: Generate module details
  if (program.modules.length > 0) {
    console.log('\n2. Testing generateModuleDetails...')
    const moduleDetails = await architect.generateModuleDetails(
      profile,
      0,
      program.modules[0].title
    )
    console.log('Module Description:', moduleDetails.description?.substring(0, 200) + '...')
    console.log('Outcomes:', moduleDetails.outcomes?.length || 0)
    console.log('Key Topics:', moduleDetails.keyTopics?.length || 0)
  }
}

async function testExerciseGeneratorAgent() {
  console.log('\n==========================================')
  console.log('Testing Exercise Generator (NVIDIA NIM)')
  console.log('==========================================')
  
  const generator = getExerciseGeneratorAgent()
  
  // Create a sample lesson
  const lesson: LessonBlueprint = {
    index: 0,
    title: 'Introduction to Python Variables',
    description: 'Learn how to create and use variables in Python',
    objectives: [
      'Understand what variables are',
      'Learn how to assign values to variables',
      'Practice using different data types',
    ],
    estimatedMinutes: 45,
    keyTopics: ['variables', 'data types', 'assignment', 'naming conventions'],
  }
  
  // Test 1: Generate exercise set
  console.log('\n1. Testing generateExerciseSet...')
  const exerciseSet = await generator.generateExerciseSet(
    lesson,
    'beginner',
    'mixed',
    []
  )
  console.log('Exercise Set Title:', exerciseSet.title)
  console.log('Description:', exerciseSet.description)
  console.log('Difficulty:', exerciseSet.difficulty)
  console.log('Type:', exerciseSet.type)
  console.log('Estimated Minutes:', exerciseSet.estimatedMinutes)
  console.log('Questions:', exerciseSet.questions.length)
  
  // Show first question
  if (exerciseSet.questions.length > 0) {
    console.log('\nFirst Question:')
    const q = exerciseSet.questions[0]
    console.log('  Type:', q.type)
    // Different exercise types have different properties
    if ('question' in q && q.question) {
      console.log('  Question:', (q.question as string).substring(0, 100) + '...')
    } else if ('prompt' in q && q.prompt) {
      console.log('  Prompt:', (q.prompt as string).substring(0, 100) + '...')
    } else if ('statement' in q && q.statement) {
      console.log('  Statement:', (q.statement as string).substring(0, 100) + '...')
    }
  }
  
  // Test 2: Generate targeted practice
  console.log('\n2. Testing generateTargetedPractice...')
  const targetedPractice = await generator.generateTargetedPractice(
    ['variables', 'data types'],
    'beginner',
    'Python Programming'
  )
  console.log('Targeted Practice Title:', targetedPractice.title)
  console.log('Questions:', targetedPractice.questions.length)
}

async function testAPIEndpoints() {
  console.log('\n==========================================')
  console.log('Testing API Endpoints')
  console.log('==========================================')
  
  const BASE_URL = 'http://localhost:3000'
  
  // Test 1: Start admissions
  console.log('\n1. Testing POST /api/admissions/start...')
  const startResponse = await fetch(`${BASE_URL}/api/admissions/start`, {
    method: 'POST',
  })
  const startData = await startResponse.json()
  console.log('Session ID:', startData.sessionId)
  console.log('First Question:', startData.currentQuestion?.question?.substring(0, 100) + '...')
  
  // Test 2: Submit answer
  if (startData.sessionId) {
    console.log('\n2. Testing POST /api/admissions/answer...')
    const answerResponse = await fetch(`${BASE_URL}/api/admissions/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: startData.sessionId,
        questionKey: 'topic',
        answer: 'Python Programming',
      }),
    })
    const answerData = await answerResponse.json()
    console.log('Is Complete:', answerData.isComplete)
    console.log('Next Question:', answerData.nextQuestion?.question?.substring(0, 100) + '...')
  }
  
  // Test 3: Generate program
  console.log('\n3. Testing POST /api/programs/generate...')
  const generateResponse = await fetch(`${BASE_URL}/api/programs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: {
        topic: 'Python Programming',
        currentLevel: 'beginner',
        goalLevel: 'intermediate',
        targetDate: '2025-06-01',
        hoursPerDay: 2,
        hoursPerWeek: 14,
        pacePreference: 'normal',
        learningPreferences: {
          videoPreference: 60,
          readingPreference: 30,
          speakingFocus: false,
          writingFocus: true,
          listeningFocus: false,
        },
        constraints: { device: 'desktop' },
        contentLanguage: 'English',
        instructionLanguage: 'English',
        strictTargetLanguage: false,
        additionalNotes: 'I want to focus on practical projects',
      },
    }),
  })
  const generateData = await generateResponse.json()
  console.log('Success:', generateData.success)
  console.log('Job ID:', generateData.jobId)
  console.log('Program ID:', generateData.programId)
  console.log('Status:', generateData.status)
  console.log('Reused:', generateData.reused || false)
}

async function runAllTests() {
  console.log('Starting Comprehensive Agent Tests...')
  console.log('=====================================')
  
  try {
    await testTutorAgent()
    await testCurriculumArchitectAgent()
    await testExerciseGeneratorAgent()
    await testAPIEndpoints()
    
    console.log('\n=====================================')
    console.log('All tests completed successfully!')
    console.log('=====================================')
  } catch (error) {
    console.error('\nTest failed:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()
