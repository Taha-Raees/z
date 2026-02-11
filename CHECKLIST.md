# CHECKLIST.md (Execution Checklist — keep updated)

> Codex must create a file named `CHECKLIST.md` at repo root, and keep it continuously updated as tasks complete.

## Phase 1 — Project setup

- [x] Initialize Next.js + TS + Tailwind + shadcn/ui
- [x] Add Prisma (or Drizzle) + SQLite and run first migration
- [x] Add auth (NextAuth recommended)
- [x] Add env management and example `.env.example`

## Phase 2 — Data models

- [x] Implement schema for all core tables
- [x] Seed minimal demo data

## Phase 3 — OpenRouter client + routing

- [x] Implement OpenRouter client
- [x] Implement model discovery (max_price=0) + capability registry
- [x] Implement routing policy + fallback to `openrouter/free`
- [x] Implement schema-enforced JSON outputs + repair retries

## Phase 4 — Agents

- [x] Admissions Officer agent
- [x] Curriculum Architect agent
- [x] Resource Curator agent (web search + YouTube)
- [x] Lesson Builder agent
- [x] Exercise Generator agent
- [x] Assessment Office agent
- [x] Grader agent
- [x] Scheduler agent
- [x] Tutor agent (contextual)

## Phase 5 — Workflows

- [x] Onboarding state machine + UI
- [x] Program generation job + progress UI
- [x] Daily plan generation
- [x] Exercise attempt + feedback loop
- [x] Quiz/test/exam flow + gradebook
- [ ] Review Center + regen practice

## Phase 6 — Polish

- [ ] Calendar UI + time budgeting
- [ ] Transcripts / progress views
- [ ] Accessibility pass
- [ ] Basic tests + linting
- [ ] Deployment guide

---

## Project Structure

```
ai-education-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db               # SQLite database
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── admissions/
│   │   │   └── programs/
│   │   ├── admissions/       # Onboarding page
│   │   ├── dashboard/       # Student dashboard
│   │   ├── programs/        # Programs list
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── lib/
│   │   ├── agents/          # AI Agents
│   │   │   ├── admissions-officer.ts
│   │   │   ├── curriculum-architect.ts
│   │   │   ├── resource-curator.ts
│   │   │   ├── lesson-builder.ts
│   │   │   ├── exercise-generator.ts
│   │   │   ├── assessment-office.ts
│   │   │   ├── grader.ts
│   │   │   ├── scheduler.ts
│   │   │   └── tutor.ts
│   │   ├── openrouter/      # OpenRouter client
│   │   │   └── client.ts
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── schemas/         # Zod schemas
│   │   │   └── index.ts
│   │   └── workflows/       # Workflow orchestrator
│   │       └── orchestrator.ts
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
├── next.config.js           # Next.js config
└── CHECKLIST.md            # This file
```

---

## Key Features Implemented

### Core Infrastructure
- ✅ Next.js 15 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Prisma ORM with SQLite
- ✅ Complete database schema with all required tables

### AI Agents (All 9 Agents)
- ✅ Admissions Officer - Handles onboarding interviews
- ✅ Curriculum Architect - Creates program structure
- ✅ Resource Curator - Finds learning resources
- ✅ Lesson Builder - Creates lesson content
- ✅ Exercise Generator - Creates practice exercises
- ✅ Assessment Office - Creates quizzes/tests/exams
- ✅ Grader - Grades student submissions
- ✅ Scheduler - Creates daily/weekly schedules
- ✅ Tutor - Provides contextual help

### OpenRouter Integration
- ✅ Client with model discovery
- ✅ Free model filtering (max_price=0)
- ✅ Capability registry
- ✅ Model routing by task type
- ✅ Schema-enforced JSON outputs
- ✅ Retry with repair prompts

### Zod Schemas
- ✅ StudentOnboardingProfile
- ✅ ProgramBlueprint
- ✅ ModuleBlueprint
- ✅ LessonBlueprint
- ✅ ResourceCandidate
- ✅ LessonNotes
- ✅ ExerciseSet (all question types)
- ✅ Assessment (quiz/test/exam)
- ✅ Rubric
- ✅ GradingResult
- ✅ DailyPlan

### UI Pages
- ✅ Home/Landing page
- ✅ Admissions interview page
- ✅ Programs list page
- ✅ Dashboard page

### API Routes
- ✅ POST /api/admissions/start - Start onboarding session
- ✅ POST /api/admissions/answer - Submit onboarding answer
- ✅ POST /api/programs/generate - Generate program
- ✅ GET /api/programs/[id] - Get program details
- ✅ POST /api/exercises/submit - Submit exercise attempt + grade
- ✅ POST /api/assessments/submit - Submit assessment + grade
- ✅ GET /api/daily-plan - Generate today's plan
- ✅ POST /api/tutor/ask - Contextual tutor response

### Workflow Orchestrator
- ✅ Program generation workflow
- ✅ Multi-agent coordination
- ✅ Progress tracking
- ✅ Error handling
- ✅ Incremental generation progress streaming (SSE) to UI with persistent partial logs and work-in-progress indicator

---

## Remaining Work

### Pages to Create
- [x] /programs/[id] - Program detail page
- [x] /programs/[id]/calendar - Calendar view
- [x] /lessons/[id] - Lesson classroom
- [x] /practice - Practice lab
- [x] /assessments/[id] - Exam room
- [x] /gradebook - Gradebook/transcripts
- [x] /review - Review center

### API Routes to Create
- [ ] GET /api/programs - List programs
- [x] GET /api/programs/[id] - Get program details
- [x] POST /api/exercises/submit - Submit exercise attempt
- [x] POST /api/assessments/submit - Submit assessment
- [ ] GET /api/gradebook - Get grades
- [x] GET /api/daily-plan - Get today's plan
- [x] POST /api/tutor/ask - Ask tutor question

### Features to Implement
- [ ] Calendar UI with weekly/monthly views
- [x] Exercise attempt with immediate feedback
- [x] Quiz/test/exam taking interface
- [ ] Gradebook with detailed analytics
- [ ] Review center with spaced repetition
- [ ] Progress tracking and analytics
- [ ] Transcript generation

### Polish
- [ ] Accessibility audit (WCAG compliance)
- [ ] Error boundaries and loading states
- [ ] Unit tests for critical functions
- [ ] ESLint configuration
- [x] TypeScript validation (`npx tsc --noEmit`)
- [ ] Deployment documentation
- [ ] Environment setup guide

---

## Notes

- All agents output schema-validated JSON
- Database uses SQLite for local development
- OpenRouter integration uses free models only
- UI follows school-like design patterns
- Progress tracking via AgentRun table
- Versioned program artifacts for consistency

---

## Remediation Updates (Latest)

- [x] Persist language policy from admissions to profile/program (`contentLanguage`, `instructionLanguage`, `strictTargetLanguage`)
- [x] Propagate language policy into curriculum/lesson/exercise/assessment/tutor generation
- [x] Add target-language QA checks with repair/regeneration in build workflow
- [x] Replace hallucinated resource links with search-backed URL validation + YouTube canonical/oEmbed checks
- [x] Remove remaining hardcoded page-level user fallbacks in dashboard/programs/practice/review/gradebook paths
- [x] Harden OpenRouter routing with provider order, timeout, cooldown, and fallback chain (`openrouter/auto` → `openrouter/free`)
- [x] Remove local loopback self-fetch from dashboard/program details in favor of server-side DB reads
- [x] Add shared institute shell component and apply to dashboard + programs pages
- [x] Add local safe DB reset workflow and execute clean reset (`npm run db:push -- --force-reset`)
- [x] Clear stale webpack cache directory (`.next/cache/webpack`) to address ENOENT rename cache warning

---

## v0.2.1 Improvements (Backend + Wiring)

### Backend Improvements (B1-B6)

#### B1: Lesson resource refresh uses real preferences
- [x] Remove hardcoded preferences from resource refresh endpoint
- [x] Fetch ProgramContext by programId for stored preferences
- [x] Use LessonContext objectives/keywords and expectedMinutes
- [x] Build resource queries from actual user preferences

#### B2: Planning-time decision for resource counts (LLM decides)
- [x] Add `resourcePlanJson` field to `LessonContext` model
- [x] Create `ResourcePlan` interface with `targetVideoCount`, `targetReadingCount`, `preferredFormat`, `rationale`
- [x] Implement `generateResourcePlan()` function using OpenRouter LLM
- [x] Resource curator uses LLM-decided `targetVideoCount` if present
- [x] Fallback to heuristic if no plan exists

#### B3: YouTube resource quality hardening
- [x] Add duration caching with `durationCache` Map and TTL
- [x] Add rate limiting for YouTube watch page fetches
- [x] Filter out Shorts (durationSeconds < 240)
- [x] Add negative keywords: `-shorts -tiktok -reels -viral -meme -funny -prank`
- [x] Add quality keywords: `tutorial`, `full course`, `lecture`, `playlist`, `series`
- [x] Playlist support for dense modules/complex lessons
- [x] Standardize qualityScore to 0-100 scale

#### B4: Resumable retry + stale RUNNING recovery
- [x] Add checkpoint fields to `ProgramBuildJob` model
- [x] Implement `updateBuildCheckpoint()` and `getBuildCheckpoint()`
- [x] Create `POST /api/programs/generate/recover/[jobId]` endpoint
- [x] Detect stale RUNNING jobs (no heartbeat for 3+ minutes)
- [x] Mark stale jobs as FAILED and queue resume with checkpoint preservation
- [x] Runner idempotency: skip completed modules/lessons/resources

#### B5: Unify job logging across program builds AND resource refresh jobs
- [x] Add `programId` and `lessonId` fields to `JobRun` model
- [x] Update `GET /api/jobs` to fetch both `ProgramBuildJob` and `JobRun`
- [x] Support filtering by `type`, `programId`, `lessonId`, `status`
- [x] Update `GET /api/jobs/[id]` to support both job types
- [x] Resource refresh endpoint creates `JobRun` with steps

#### B6: Context pack improvements (RAG-lite)
- [x] Implement `buildContextPack(programId, lessonId)` function
- [x] Create compact "Course Map" summary string
- [x] Include program goals, module outline, lesson objectives, prerequisites
- [x] Keep context bounded to avoid huge JSON dumps
- [x] Resource selection uses context pack for better queries

### Frontend Improvements (F1-F5)

#### F1: Add "Refresh videos/resources" button on lesson page
- [x] Create `RefreshResourcesButton` client component
- [x] Add button near resources section on lesson page
- [x] Show loading state during refresh
- [x] Display success/error messages
- [x] Refetch resources list after refresh

#### F2: Display resource metadata cleanly
- [x] Create `LessonResources` client component
- [x] Show `channel` from sourceMetaJson
- [x] Format `durationSeconds` as `mm:ss`
- [x] Display quality indicator from qualityScore
- [x] Show `refreshedAt` timestamp

#### F3: Implement "View activity" drawer/panel using /api/jobs
- [x] Update `ActivityDrawer` component to fetch real data
- [x] Fetch `GET /api/jobs?limit=10` on open
- [x] Support filtering by `programId` and `lessonId`
- [x] List jobs with status pill and time
- [x] Click job to load details from `GET /api/jobs/[id]`
- [x] Show last 20 events with collapsible technical details

#### F4: Admissions/Program build pipeline UX improvements
- [x] Replace "Retry" label with "Resume build" semantics
- [x] Add "Recover stuck build" button for stale RUNNING jobs
- [x] Call recover endpoint for stuck jobs
- [x] Show backend returned `resumeFrom.message`

#### F5: Minor correctness/polish
- [x] Program list cards show correct progress and generation status
- [x] Program detail "Open" links are correct
- [x] Consistent UI styling with existing components

### New/Updated Files

#### Backend Files
- `prisma/schema.prisma` - Added `resourcePlanJson` to LessonContext, `programId`/`lessonId` to JobRun
- `src/lib/context-store.ts` - Added ResourcePlan interface, generateResourcePlan(), buildContextPack()
- `src/lib/agents/resource-curator.ts` - Duration caching, rate limiting, context pack support
- `src/lib/workflows/program-build-runner.ts` - Resource plan generation, programId parameter
- `src/lib/workflows/program-build-store.ts` - Checkpoint functions
- `src/app/api/programs/generate/recover/[jobId]/route.ts` - New recover endpoint
- `src/app/api/jobs/route.ts` - Unified job listing
- `src/app/api/jobs/[id]/route.ts` - Unified job details
- `src/app/api/lessons/[lessonId]/resources/route.ts` - Resource refresh with JobRun

#### Frontend Files
- `src/components/ui/refresh-resources-button.tsx` - New component
- `src/components/ui/lesson-resources.tsx` - New component
- `src/components/ui/activity-drawer.tsx` - Updated with real data
- `src/app/admissions/page.tsx` - Resume/Recover semantics
- `src/app/lessons/[id]/page.tsx` - Integrated refresh button and resources display

### New/Updated Endpoints

- `POST /api/programs/generate/recover/[jobId]` - Recover stale RUNNING jobs
- `GET /api/jobs?type=&programId=&lessonId=&status=&limit=&offset=` - Unified job listing
- `GET /api/jobs/[id]` - Unified job details (supports both ProgramBuildJob and JobRun)
- `POST /api/lessons/[lessonId]/resources` - Resource refresh with JobRun logging

---

**Last Updated:** 2026-02-11
