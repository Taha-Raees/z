# TODO: Frontend Changes Needed for v0.2 Backend Engine Upgrade

This document lists UI changes needed to support the new backend features implemented in v0.2.

---

## 1. Lesson Resource Refresh Button

### Location: Lesson Detail Page (`src/app/lessons/[id]/page.tsx`)

**Requirement:** Add a "Refresh Videos" button that allows users to refresh only the lesson's video resources without rebuilding the entire course.

**Implementation:**
- Add a button in the lesson resources section
- Button should call `POST /api/lessons/[lessonId]/resources/refresh`
- Show loading state while refresh is in progress
- Display success/error messages
- Update the resources list after successful refresh

**Example API Call:**
```typescript
const refreshResources = async (lessonId: string) => {
  const response = await fetch(`/api/lessons/${lessonId}/resources/refresh`, {
    method: 'POST',
  })
  const data = await response.json()
  // data.resources contains the updated resources
}
```

**Expected Response:**
```json
{
  "success": true,
  "resources": [
    {
      "id": "clx...",
      "type": "video",
      "url": "https://www.youtube.com/watch?v=...",
      "title": "Video Title",
      "description": "Video description",
      "durationSeconds": 1800,
      "channel": "Channel Name",
      "qualityScore": 85,
      "sourceMetaJson": "{\"refreshedAt\":\"2026-02-11T15:00:00Z\"}"
    }
  ],
  "refreshedAt": "2026-02-11T15:00:00Z"
}
```

---

## 2. Job Status Display Improvements

### Location: Program Generation Status / Job Status Components

**Requirement:** Display checkpoint information and resume status when retrying a failed build job.

**Implementation:**
- Show `resumeFrom` information in retry response
- Display which module/lesson the build will resume from
- Show `retryCount` to indicate how many times the job has been retried
- Display `lastCompletedModuleIndex` and `lastCompletedLessonIndex` from checkpoint

**Example API Response (Retry):**
```json
{
  "success": true,
  "job": {
    "id": "clx...",
    "status": "QUEUED",
    "retryCount": 1,
    "lastCompletedModuleIndex": 2,
    "lastCompletedLessonIndex": 3,
    "lastCompletedStepKey": "resources"
  },
  "resumeFrom": {
    "moduleIndex": 2,
    "lessonIndex": 3,
    "stepKey": "resources",
    "message": "Resuming from Module 3, Lesson 4, step: resources"
  }
}
```

**UI Elements to Add:**
- "Resume from: Module X, Lesson Y" message
- Retry count badge
- Progress bar showing checkpoint position

---

## 3. Resource Metadata Display

### Location: Lesson Resources Section

**Requirement:** Display additional resource metadata that is now available from the backend.

**Implementation:**
- Show `durationSeconds` as human-readable duration (e.g., "30:00")
- Show `channel` name for YouTube videos
- Show `qualityScore` as a visual indicator (e.g., star rating or color-coded badge)
- Display `refreshedAt` timestamp if resource was refreshed

**Example Resource Object:**
```typescript
{
  id: "clx...",
  type: "video",
  url: "https://www.youtube.com/watch?v=...",
  title: "Video Title",
  description: "Video description",
  durationSeconds: 1800,  // Display as "30:00"
  channel: "Channel Name",
  qualityScore: 85,  // Display as 4.2/5 stars or "High Quality"
  sourceMetaJson: "{\"refreshedAt\":\"2026-02-11T15:00:00Z\"}"
}
```

**UI Components:**
- Duration badge next to video title
- Channel name below title
- Quality score indicator (stars or progress bar)
- "Refreshed" badge with timestamp if applicable

---

## 4. Jobs List Page

### Location: New Page or Dashboard Section

**Requirement:** Display a list of recent program build jobs with filtering capabilities.

**Implementation:**
- Create a page or section to display jobs
- Use `GET /api/jobs` endpoint with optional filters
- Show job status, program title, creation time, and progress
- Add filters for: userId, programId, status
- Add pagination support

**Example API Call:**
```typescript
const fetchJobs = async (filters?: {
  userId?: string
  programId?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  const params = new URLSearchParams(filters as any)
  const response = await fetch(`/api/jobs?${params}`)
  const data = await response.json()
  // data.jobs contains the list of jobs
  // data.pagination contains pagination info
}
```

**Expected Response:**
```json
{
  "jobs": [
    {
      "id": "clx...",
      "status": "COMPLETED",
      "programId": "clx...",
      "programTitle": "Learn Python Programming",
      "createdAt": "2026-02-11T10:00:00Z",
      "completedAt": "2026-02-11T10:30:00Z",
      "retryCount": 0,
      "lastCompletedModuleIndex": 4,
      "lastCompletedLessonIndex": 19
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 10,
    "offset": 0
  }
}
```

**UI Elements:**
- Table or card list of jobs
- Status badges (QUEUED, RUNNING, COMPLETED, FAILED)
- Filter dropdowns
- Pagination controls
- Click to view job details

---

## 5. Job Details Page

### Location: New Page or Modal

**Requirement:** Display detailed information about a specific job including events.

**Implementation:**
- Create a page or modal to show job details
- Use `GET /api/jobs/[id]` endpoint
- Show job information and recent events
- Display event timeline

**Example API Call:**
```typescript
const fetchJobDetails = async (jobId: string) => {
  const response = await fetch(`/api/jobs/${jobId}`)
  const data = await response.json()
  // data.job contains job details
  // data.events contains recent events
}
```

**Expected Response:**
```json
{
  "job": {
    "id": "clx...",
    "status": "COMPLETED",
    "programId": "clx...",
    "programTitle": "Learn Python Programming",
    "createdAt": "2026-02-11T10:00:00Z",
    "completedAt": "2026-02-11T10:30:00Z",
    "retryCount": 0,
    "lastCompletedModuleIndex": 4,
    "lastCompletedLessonIndex": 19
  },
  "events": [
    {
      "id": "clx...",
      "jobId": "clx...",
      "eventType": "MODULE_COMPLETED",
      "message": "Completed Module 1: Introduction",
      "dataJson": "{\"moduleIndex\":0,\"moduleId\":\"clx...\"}",
      "createdAt": "2026-02-11T10:05:00Z"
    }
  ]
}
```

**UI Elements:**
- Job status and metadata
- Event timeline with timestamps
- Event type badges
- Expandable event details

---

## 6. Shorts Filtering Indicator

### Location: Lesson Resources Section

**Requirement:** Indicate to users that Shorts have been filtered out from results.

**Implementation:**
- Add a small note or badge indicating "Shorts filtered out"
- Show the number of Shorts that were filtered (if available)
- This provides transparency about the filtering process

**UI Element:**
- Small text below resources: "Shorts (< 4 min) have been filtered from results"
- Or a badge: "✓ No Shorts"

---

## 7. Dynamic Resource Count Indicator

### Location: Lesson Resources Section

**Requirement:** Show the target number of resources for each lesson.

**Implementation:**
- Display the target resource count (e.g., "3-6 resources")
- Show the actual number of resources found
- This helps users understand why some lessons have more/less resources

**UI Element:**
- Text: "Target: 3-6 resources | Found: 4 resources"
- Or a progress bar showing actual vs target

---

## Summary of New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lessons/[lessonId]/resources` | GET | Get lesson resources with metadata |
| `/api/lessons/[lessonId]/resources/refresh` | POST | Refresh lesson resources |
| `/api/jobs` | GET | List recent jobs with filters |
| `/api/jobs/[id]` | GET | Get job details with events |

---

## Notes

- All new endpoints maintain backward compatibility with existing API responses
- No breaking changes to existing endpoints
- All new features are optional - the frontend can choose which to implement
- The backend will continue to work without these UI changes
