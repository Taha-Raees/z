# AI School Engine Documentation (v0.2)

This document describes the backend engine upgrades implemented in v0.2 of the AI School system.

## Table of Contents

1. [Resumable Retry](#resumable-retry)
2. [Context Store (RAG)](#context-store-rag)
3. [Resource Curator Upgrades](#resource-curator-upgrades)
4. [Lesson Resource Refresh](#lesson-resource-refresh)
5. [Job Logging & Observability](#job-logging--observability)
6. [API Endpoints](#api-endpoints)

---

## Resumable Retry

### Overview

Program build jobs now support resumable retry behavior. When a build fails and is retried, it will resume from where it left off instead of restarting the entire course generation.

### Implementation

#### Checkpoint System

The [`ProgramBuildJob`](../prisma/schema.prisma) model now includes checkpoint fields:

- `lastCompletedModuleIndex`: The last module index that was fully completed
- `lastCompletedLessonIndex`: The last lesson index within the module that was fully completed
- `lastCompletedStepKey`: The last step key that was completed (e.g., `'plan'`, `'module_0'`, `'module_0_lesson_1'`)
- `checkpointDataJson`: Additional checkpoint data for recovery

#### Resume Behavior

When a retry is triggered:

1. The job status is set to `QUEUED` but checkpoint data is preserved
2. The `retryCount` is incremented
3. Error and stale heartbeat fields are cleared
4. The build runner checks the checkpoint and resumes from the next incomplete step

#### Key Functions

- [`updateBuildCheckpoint()`](../src/lib/workflows/program-build-store.ts): Updates checkpoint data during build
- [`getBuildCheckpoint()`](../src/lib/workflows/program-build-store.ts): Retrieves checkpoint data for recovery
- [`resetBuildJobForRetry()`](../src/lib/workflows/program-build-store.ts): Prepares job for retry while preserving checkpoints

#### Example

```typescript
// Retry a failed build job
POST /api/programs/generate/retry/[jobId]

Response:
{
  "success": true,
  "jobId": "cm123abc",
  "programId": "cm456def",
  "status": "QUEUED",
  "retryCount": 1,
  "maxRetries": 2,
  "resumeFrom": "module_2_lesson_3",
  "checkpoint": {
    "moduleIndex": 2,
    "lessonIndex": 3,
    "stepKey": "module_2_lesson_3"
  }
}
```

---

## Context Store (RAG)

### Overview

A lightweight context store has been implemented to provide LLM calls with awareness of course and lesson context. This enables better resource discovery and content generation.

### Implementation

#### Data Models

Two new models store context:

- [`ProgramContext`](../prisma/schema.prisma): Stores program-level context
  - `profileSummary`: Student onboarding profile summary
  - `planSummary`: Program blueprint summary
  - `moduleOutlinesJson`: Array of module outlines
  - `constraintsJson`: Target date, hours per day, current/goal levels
  - `languagePolicyJson`: Content and instruction language settings

- [`LessonContext`](../prisma/schema.prisma): Stores lesson-level context
  - `objectivesJson`: Lesson objectives
  - `notesSummary`: Generated notes summary
  - `keyTopicsJson`: Key topics covered
  - `difficultyLevel`: Inferred difficulty (beginner/intermediate/advanced)
  - `expectedMinutes`: Expected duration

#### Key Functions

- [`upsertProgramContext()`](../src/lib/context-store.ts): Creates/updates program context
- [`upsertLessonContext()`](../src/lib/context-store.ts): Creates/updates lesson context
- [`buildContextPack()`](../src/lib/context-store.ts): Builds context pack for LLM calls

#### Context Pack Format

```typescript
{
  programContext: ProgramContextData | null,
  lessonContext: LessonContextData | null,
  moduleContext: { index, title, outcomes } | null,
  formattedPrompt: string  // Formatted for LLM consumption
}
```

#### Example

```typescript
// Get context pack for a lesson
const contextPack = await buildContextPack({
  programId: 'cm456def',
  lessonId: 'cm789ghi',
  moduleId: 'cm012jkl'
})

// Use in agent calls
const resources = await resourceCurator.findResources(
  topic,
  lessonBlueprint,
  moduleTitle,
  preferences,
  languagePolicy,
  contextPack.formattedPrompt  // Context-aware search
)
```

---

## Resource Curator Upgrades

### Overview

The resource curator has been significantly upgraded to provide higher-quality, long-form educational content while filtering out low-quality Shorts.

### Key Improvements

#### 1. Dynamic Resource Count

- **Before**: Hardcoded to 5 resources per lesson
- **After**: Dynamic count based on lesson complexity (2-10 resources)
  - Base: 4 resources
  - +1 for lessons > 60 minutes
  - +1 for lessons > 90 minutes
  - +1 for > 4 objectives
  - +1 for > 4 key topics
  - Adjusted by video preference

#### 2. Shorts Filtering

- **Threshold**: Videos < 240 seconds (4 minutes) are filtered out
- **Detection**: Parses `ytInitialPlayerResponse` from YouTube watch page
- **URL Detection**: Also filters `/shorts/` URLs

#### 3. Duration Extraction

```typescript
// Extract duration from YouTube video
const durationInfo = await extractYouTubeDuration(url)
// Returns: { durationSeconds: number | null, isShort: boolean }
```

#### 4. Improved Ranking

- **Channel Boost**: +0.15 for known educational channels (100+ channels)
- **Duration Boost**: +0.1 for 8-60 minute videos
- **Tutorial Boost**: +0.12 for titles containing "tutorial", "course", "lecture", "complete", "full", "series", "playlist"

#### 5. Enhanced Search Queries

- **Negative Keywords**: `-shorts -tiktok -reels -viral -meme -funny -prank`
- **Quality Keywords**: "full course", "complete guide", "step by step", "crash course"
- **Language Support**: Includes content language in queries

#### 6. Metadata Storage

Resources now store:
- `durationSeconds`: Video duration in seconds
- `channel`: YouTube channel name
- `qualityScore`: Computed quality score (0-1)
- `sourceMetaJson`: Additional metadata (reason, relevanceScore, refreshedAt)

### Example

```typescript
// Find resources with upgraded curator
const resources = await resourceCurator.findResources(
  topic: 'German',
  lesson: { title: 'Basic Greetings', objectives: [...], ... },
  moduleTitle: 'Module 1: Introduction',
  preferences: { videoPreference: 70, readingPreference: 30 },
  languagePolicy: { contentLanguage: 'German', ... }
)

// Returns 4-6 resources (dynamic count)
// All videos are > 4 minutes
// Boosted for educational channels and long-form content
```

---

## Lesson Resource Refresh

### Overview

A new endpoint allows refreshing lesson resources without rebuilding the entire course. This uses context-aware search to find better resources.

### API Endpoint

#### POST /api/lessons/[lessonId]/resources/refresh

Refreshes lesson resources using context-aware search.

**Request:**
```http
POST /api/lessons/cm789ghi/resources/refresh
```

**Response:**
```json
{
  "success": true,
  "lessonId": "cm789ghi",
  "resources": [
    {
      "id": "cm111aaa",
      "type": "YOUTUBE",
      "title": "German Greetings - Complete Tutorial",
      "url": "https://www.youtube.com/watch?v=abc123",
      "durationSeconds": 1800,
      "qualityScore": 0.85,
      "sourceMeta": {
        "channel": "Learn German",
        "reason": "Selected from search results matching lesson objectives.",
        "relevanceScore": 0.78,
        "refreshedAt": "2026-02-11T15:00:00.000Z"
      }
    }
  ],
  "contextUsed": {
    "programContext": true,
    "lessonContext": true,
    "moduleContext": true
  },
  "refreshedAt": "2026-02-11T15:00:00.000Z"
}
```

#### GET /api/lessons/[lessonId]/resources

Gets lesson resources with metadata.

**Request:**
```http
GET /api/lessons/cm789ghi/resources
```

**Response:**
```json
{
  "success": true,
  "lessonId": "cm789ghi",
  "resources": [...],
  "count": 4
}
```

### Implementation Details

1. **Context Retrieval**: Fetches program, lesson, and module context
2. **Resource Discovery**: Uses resource curator with context-aware search
3. **Safe Replacement**: Deletes old resources and creates new ones in a transaction
4. **Metadata Tracking**: Stores refresh timestamp in `sourceMetaJson`

---

## Job Logging & Observability

### Overview

Job logging endpoints provide visibility into program build jobs and their execution status.

### API Endpoints

#### GET /api/jobs

Lists recent program build jobs with optional filtering.

**Query Parameters:**
- `userId`: Filter by user ID
- `programId`: Filter by program ID
- `status`: Filter by status (QUEUED, RUNNING, COMPLETED, FAILED, CANCELED)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Request:**
```http
GET /api/jobs?status=RUNNING&limit=10
```

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "cm123abc",
      "userId": "user123",
      "programId": "cm456def",
      "program": {
        "id": "cm456def",
        "topic": "German",
        "goal": "B1"
      },
      "type": "program_build",
      "status": "RUNNING",
      "currentPhase": "module",
      "currentItem": "Module 2: Basic Grammar",
      "totalModules": 6,
      "completedModules": 1,
      "totalLessons": 24,
      "completedLessons": 4,
      "retryCount": 0,
      "maxRetries": 2,
      "error": null,
      "startedAt": "2026-02-11T14:00:00.000Z",
      "finishedAt": null,
      "lastHeartbeatAt": "2026-02-11T14:30:00.000Z",
      "createdAt": "2026-02-11T14:00:00.000Z",
      "updatedAt": "2026-02-11T14:30:00.000Z",
      "lastEventIndex": 15
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET /api/jobs/[id]

Gets detailed job information with events.

**Request:**
```http
GET /api/jobs/cm123abc
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "cm123abc",
    "userId": "user123",
    "programId": "cm456def",
    "program": {
      "id": "cm456def",
      "topic": "German",
      "goal": "B1",
      "currentLevel": "A1",
      "targetDate": "2026-06-01T00:00:00.000Z",
      "status": "ACTIVE"
    },
    "type": "program_build",
    "status": "RUNNING",
    "currentPhase": "module",
    "currentItem": "Module 2: Basic Grammar",
    "totalModules": 6,
    "completedModules": 1,
    "totalLessons": 24,
    "completedLessons": 4,
    "retryCount": 0,
    "maxRetries": 2,
    "error": null,
    "startedAt": "2026-02-11T14:00:00.000Z",
    "finishedAt": null,
    "lastHeartbeatAt": "2026-02-11T14:30:00.000Z",
    "createdAt": "2026-02-11T14:00:00.000Z",
    "updatedAt": "2026-02-11T14:30:00.000Z",
    "lastEventIndex": 15
  },
  "events": [
    {
      "id": "evt1",
      "index": 15,
      "type": "lesson.started",
      "step": "Module 2 / Lesson 1",
      "status": "IN_PROGRESS",
      "level": "INFO",
      "message": "Building lesson: Basic Grammar",
      "payload": {
        "lessonId": "cm789ghi",
        "moduleId": "cm012jkl",
        "moduleIndex": 1,
        "lessonIndex": 0,
        "lessonTitle": "Basic Grammar"
      },
      "createdAt": "2026-02-11T14:30:00.000Z"
    }
  ],
  "eventCount": 16
}
```

---

## API Endpoints Summary

### Program Build

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/programs/generate` | Start program generation |
| POST | `/api/programs/generate/retry/[jobId]` | Retry failed build (resumable) |
| GET | `/api/programs/generate/status/[jobId]` | Get build job status |
| GET | `/api/programs/generate/events/[jobId]` | Stream build events (SSE) |
| GET | `/api/programs/[id]` | Get program details |

### Lesson Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lessons/[lessonId]/resources` | Get lesson resources |
| POST | `/api/lessons/[lessonId]/resources/refresh` | Refresh lesson resources |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List recent jobs |
| GET | `/api/jobs/[id]` | Get job details with events |

---

## Manual Verification

### 1. Generate a Course

```bash
# Start onboarding and generate a program
POST /api/admissions/start
POST /api/admissions/answer  # Complete onboarding
POST /api/programs/generate  # Generate program
```

### 2. Interrupt Build

```bash
# While build is running, kill the process or simulate failure
# The job will be marked as FAILED
```

### 3. Retry and Observe Resume

```bash
# Retry the failed build
POST /api/programs/generate/retry/[jobId]

# Observe that it resumes from checkpoint
GET /api/jobs/[jobId]  # Check resumeFrom field
```

### 4. Refresh Lesson Videos

```bash
# Get lesson resources
GET /api/lessons/[lessonId]/resources

# Refresh resources
POST /api/lessons/[lessonId]/resources/refresh

# Verify no Shorts and better long-form content
GET /api/lessons/[lessonId]/resources
```

### 5. Verify Context Store

```bash
# Check program context exists
# (Query database: SELECT * FROM program_contexts WHERE programId = ?)

# Check lesson context exists
# (Query database: SELECT * FROM lesson_contexts WHERE lessonId = ?)
```

---

## Database Schema Changes

### New Fields on ProgramBuildJob

```prisma
lastCompletedModuleIndex  Int?
lastCompletedLessonIndex  Int?
lastCompletedStepKey      String?
checkpointDataJson        String?
```

### New Models

```prisma
model ProgramContext {
  id                String   @id @default(cuid())
  programId         String   @unique
  profileSummary    String   @default("")
  planSummary       String   @default("")
  moduleOutlinesJson String  @default("[]")
  constraintsJson   String   @default("{}")
  languagePolicyJson String @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  program           Program  @relation(...)
}

model LessonContext {
  id                String   @id @default(cuid())
  lessonId          String   @unique
  objectivesJson    String   @default("[]")
  notesSummary      String   @default("")
  keyTopicsJson     String   @default("[]")
  difficultyLevel   String?
  expectedMinutes   Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lesson            Lesson   @relation(...)
}
```

---

## Migration Notes

To apply the schema changes:

```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

---

## Known Limitations

1. **Prisma Client**: The new checkpoint fields require Prisma client regeneration
2. **JobRun Model**: The generic JobRun/JobStep models exist but aren't used yet (ProgramBuildJob is used instead)
3. **Playlist Support**: Basic playlist detection exists but full playlist handling is not implemented
4. **Vector Search**: Context store uses keyword-based retrieval, not vector embeddings

---

## Future Enhancements

1. **Vector Embeddings**: Add vector search for better context retrieval
2. **Playlist Support**: Full playlist handling and multi-part series
3. **Resource Versioning**: Track resource history instead of replacing
4. **Smart Retry**: Auto-retry with exponential backoff
5. **Resource Analytics**: Track resource usage and effectiveness
