#!/bin/bash

# Test API endpoints using curl
# Server: http://localhost:3000

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Testing AI Education System API"
echo "=========================================="

# Test 1: Start Admissions Assessment
echo ""
echo "Test 1: Starting Admissions Assessment..."
echo "------------------------------------------"
START_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/start")

echo "$START_RESPONSE" | jq '.'

# Extract session ID
SESSION_ID=$(echo "$START_RESPONSE" | jq -r '.sessionId')

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
  echo ""
  echo "✓ Assessment started with Session ID: $SESSION_ID"
  
  # Test 2: Submit Answer to First Question (topic)
  echo ""
  echo "Test 2: Submitting Answer to First Question (topic)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"topic\",
      \"answer\": \"Python Programming\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 3: Submit Answer to Second Question (contentLanguage)
  echo ""
  echo "Test 3: Submitting Answer to Second Question (contentLanguage)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"contentLanguage\",
      \"answer\": \"English\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 4: Submit Answer to Third Question (currentLevel)
  echo ""
  echo "Test 4: Submitting Answer to Third Question (currentLevel)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"currentLevel\",
      \"answer\": \"Beginner\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 5: Submit Answer to Fourth Question (goalLevel)
  echo ""
  echo "Test 5: Submitting Answer to Fourth Question (goalLevel)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"goalLevel\",
      \"answer\": \"Intermediate\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 6: Submit Answer to Fifth Question (targetDate)
  echo ""
  echo "Test 6: Submitting Answer to Fifth Question (targetDate)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"targetDate\",
      \"answer\": \"2025-06-01\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 7: Submit Answer to Sixth Question (hoursPerDay)
  echo ""
  echo "Test 7: Submitting Answer to Sixth Question (hoursPerDay)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"hoursPerDay\",
      \"answer\": \"2-3 hours\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 8: Submit Answer to Seventh Question (pacePreference)
  echo ""
  echo "Test 8: Submitting Answer to Seventh Question (pacePreference)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"pacePreference\",
      \"answer\": \"Normal (balanced pace)\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Test 9: Submit Answer to Eighth Question (learningPreferences - optional)
  echo ""
  echo "Test 9: Submitting Answer to Eighth Question (learningPreferences - optional)..."
  echo "------------------------------------------"
  ANSWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admissions/answer" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"questionKey\": \"learningPreferences\",
      \"answer\": \"I prefer more videos and writing practice\"
    }")
  
  echo "$ANSWER_RESPONSE" | jq '.'
  
  # Check if assessment is complete
  IS_COMPLETE=$(echo "$ANSWER_RESPONSE" | jq -r '.isComplete // false')
  
  if [ "$IS_COMPLETE" = "true" ]; then
    echo ""
    echo "✓ Assessment completed!"
    
    # Extract profile if available
    PROFILE=$(echo "$ANSWER_RESPONSE" | jq -r '.profile // empty')
    
    if [ -n "$PROFILE" ] && [ "$PROFILE" != "null" ]; then
      echo ""
      echo "✓ Profile generated:"
      echo "$PROFILE" | jq '.'
    else
      echo ""
      echo "Note: Profile not returned in response."
    fi
  else
    echo ""
    echo "Note: Assessment not yet complete. More questions may be available."
  fi
else
  echo ""
  echo "✗ Failed to start assessment"
fi

# Test 10: Generate Program (if not already generated)
echo ""
echo "Test 10: Generating Program..."
echo "------------------------------------------"
echo "Note: If an existing job is running, it will be reused. To test a new Python course,"
echo "we need to wait for any existing jobs to complete first."

GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/programs/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "topic": "Python Programming",
      "currentLevel": "beginner",
      "goalLevel": "intermediate",
      "targetDate": "2025-06-01",
      "hoursPerDay": 2,
      "hoursPerWeek": 14,
      "pacePreference": "normal",
      "learningPreferences": {
        "videoPreference": 60,
        "readingPreference": 30,
        "speakingFocus": false,
        "writingFocus": true,
        "listeningFocus": false
      },
      "constraints": {
        "device": "desktop"
      },
      "contentLanguage": "English",
      "instructionLanguage": "English",
      "strictTargetLanguage": false,
      "additionalNotes": "I want to focus on practical projects"
    }
  }')

echo "$GENERATE_RESPONSE" | jq '.'

# Extract job ID
JOB_ID=$(echo "$GENERATE_RESPONSE" | jq -r '.jobId')
REUSED=$(echo "$GENERATE_RESPONSE" | jq -r '.reused // false')

if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
  echo ""
  if [ "$REUSED" = "true" ]; then
    echo "⚠️  Note: Reused existing job (Job ID: $JOB_ID)"
    echo "This job may be for a different topic. To test Python Programming,"
    echo "wait for this job to complete or cancel it first."
  else
    echo "✓ Program generation started with Job ID: $JOB_ID"
  fi

# Extract job ID
JOB_ID=$(echo "$GENERATE_RESPONSE" | jq -r '.jobId')

if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
  echo ""
  echo "✓ Program generation started with Job ID: $JOB_ID"
  
  # Test 9: Check Job Status
  echo ""
  echo "Test 9: Checking Job Status..."
  echo "------------------------------------------"
  sleep 2
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/programs/generate/status/$JOB_ID")
  echo "$STATUS_RESPONSE" | jq '.'
  
  # Test 10: Stream Job Progress
  echo ""
  echo "Test 10: Streaming Job Progress..."
  echo "------------------------------------------"
  STREAM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/programs/generate/stream" \
    -H "Content-Type: application/json" \
    -d "{\"jobId\": \"$JOB_ID\"}")
  echo "$STREAM_RESPONSE" | jq '.'
  
  # Wait a bit and check final status
  echo ""
  echo "Waiting for program generation to complete..."
  sleep 5
  
  FINAL_STATUS=$(curl -s -X GET "$BASE_URL/api/programs/generate/status/$JOB_ID")
  echo ""
  echo "Final Status:"
  echo "------------------------------------------"
  echo "$FINAL_STATUS" | jq '.'
  
  # Extract program ID from final status
  FINAL_PROGRAM_ID=$(echo "$FINAL_STATUS" | jq -r '.programId // empty')
  
  if [ -n "$FINAL_PROGRAM_ID" ] && [ "$FINAL_PROGRAM_ID" != "null" ]; then
    echo ""
    echo "✓ Program generated with ID: $FINAL_PROGRAM_ID"
    
    # Test 11: Get Generated Program
    echo ""
    echo "Test 11: Getting Generated Program..."
    echo "------------------------------------------"
    PROGRAM_DETAILS=$(curl -s -X GET "$BASE_URL/api/programs/$FINAL_PROGRAM_ID")
    echo "$PROGRAM_DETAILS" | jq '.'
  fi
else
  echo ""
  echo "✗ Failed to start program generation"
fi

echo ""
echo "=========================================="
echo "API Testing Complete"
echo "=========================================="
