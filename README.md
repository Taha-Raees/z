# AI Education System

A full-stack **AI Education System** that behaves like a **virtual school** powered by multiple AI agents. The platform provides structured onboarding → program → schedule → lessons → practice → quizzes/tests/exams → progress → review/regeneration.

## 🎓 Features

### Core Functionality
- **Admissions Interview**: Guided multi-step onboarding that collects student goals, current level, timeline, and preferences
- **Dynamic Curriculum**: AI-generated courses with modules, lessons, and learning outcomes
- **Resource Curation**: Automatic discovery of YouTube videos, articles, and other learning materials
- **Interactive Exercises**: Multiple formats including MCQ, true/false, matching, cloze, short answer, listening, reading, speaking, and writing
- **Assessments**: Quizzes, tests, and exams with AI-powered grading
- **Progress Tracking**: Detailed analytics, gradebook, and transcripts
- **Personalized Scheduling**: Daily and weekly plans based on student availability
- **Contextual Tutor**: AI tutor that provides help based on current lesson/exercise

### AI Agents (9 Specialized Agents)
1. **Admissions Officer** - Collects onboarding information
2. **Curriculum Architect** - Creates program structure
3. **Resource Curator** - Finds and curates learning resources
4. **Lesson Builder** - Creates lesson content scaffolds
5. **Exercise Generator** - Generates practice exercises
6. **Assessment Office** - Creates quizzes, tests, and exams
7. **Grader** - Grades student submissions
8. **Scheduler** - Creates daily/weekly schedules
9. **Tutor** - Provides contextual help

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **AI Integration**: NVIDIA NIM API + OpenRouter API (free models only)
- **Validation**: Zod schemas
- **Auth**: NextAuth (configured)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-education-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
OPENROUTER_API_KEY=your-openrouter-api-key-here
NVIDIA_NIM_API_KEY=your-nvidia-nim-api-key-here
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=your-secret-key-here
```

**Important**: You must replace the API keys with valid values:
- Get your free OpenRouter API key from [openrouter.ai](https://openrouter.ai/keys)
- Get your NVIDIA NIM API key from [build.nvidia.com](https://build.nvidia.com/)

The system will not work without valid API keys. NVIDIA NIM is used for complex reasoning tasks, while OpenRouter provides fast free models for simpler tasks.

4. Initialize the database:
```bash
npx prisma db push
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ai-education-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db               # SQLite database
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── admissions/       # Onboarding page
│   │   ├── dashboard/       # Student dashboard
│   │   ├── programs/        # Programs list
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   └── lib/
│       ├── agents/          # AI Agents
│       ├── openrouter/      # OpenRouter client
│       ├── prisma.ts        # Prisma client singleton
│       ├── schemas/         # Zod schemas
│       └── workflows/       # Workflow orchestrator
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
├── next.config.js           # Next.js config
├── CHECKLIST.md            # Progress tracking
└── README.md               # This file
```

## 🎨 UI Pages

### Implemented
- `/` - Landing page with features and how it works
- `/admissions` - Onboarding interview flow
- `/programs` - List of enrolled programs
- `/dashboard` - Student dashboard with today's schedule

### Planned
- `/programs/[id]` - Program detail view
- `/programs/[id]/calendar` - Calendar view
- `/lessons/[id]` - Lesson classroom
- `/practice` - Practice lab
- `/assessments/[id]` - Exam room
- `/gradebook` - Gradebook and transcripts
- `/review` - Review center

## 🔌 AI Integration

The system uses a dual-API approach with intelligent task distribution:

### NVIDIA NIM API
Used for complex reasoning tasks requiring deep analysis:

**Models:**
- **GLM-4.7** (`z-ai/glm4.7`): Complex reasoning tasks (curriculum generation, program building, JSON schema validation, assessments)
- **Kimi K2.5** (`moonshotai/kimi-k2.5`): Large context tasks (long conversations, multi-step workflows)

**Features:**
- 128K-256K context window support
- Advanced reasoning capabilities
- JSON schema validation support

### OpenRouter API
Used for fast, simple tasks requiring quick responses:

**Models:**
- **trinity-mini** (`arcee-ai/trinity-mini:free`): Fast simple tasks (tutor Q&A, quick responses, admissions)
- **trinity-large** (`arcee-ai/trinity-large-preview:free`): Standard quality tasks (exercise generation, lesson building, grading, scheduling)

**Features:**
- Free tier models only
- Fast response times
- Automatic fallback mechanisms

### Task Priority System
The system intelligently routes tasks based on priority:

| Priority | Use Case | Primary Model | Fallback |
|----------|----------|---------------|----------|
| `fast` | Quick Q&A, simple responses | trinity-mini | trinity-large → NVIDIA |
| `standard` | Exercise generation, lesson building | trinity-large | trinity-mini → NVIDIA |
| `reasoning` | Complex curriculum, assessments | GLM-4.7 | trinity-large |
| `large-context` | Long conversations, workflows | Kimi K2.5 | trinity-large |
| `complex` | Multi-API parallel execution | GLM-4.7 + trinity-large | - |

### Agent Model Assignments
- **Tutor Agent**: `fast` priority → trinity-mini
- **Curriculum Architect**: `reasoning` priority → GLM-4.7
- **Exercise Generator**: `standard` priority → trinity-large
- **Lesson Builder**: `standard` priority → trinity-large
- **Grader**: `standard` priority → trinity-large
- **Admissions Officer**: `fast` priority → trinity-mini
- **Assessment Office**: `reasoning` priority → GLM-4.7
- **Scheduler**: `standard` priority → trinity-large
- **Resource Curator**: No AI client (uses web search)

### Language Policy Enforcement
- Admissions captures and persists:
  - `contentLanguage`
  - `instructionLanguage`
  - `strictTargetLanguage`
- Program records persist language policy per version.
- Curriculum, lessons, exercises, assessments, and tutor prompts apply a shared language directive.
- Build workflow runs language leakage checks and repair/retry passes before persistence.

### Resource Curation Safety
- Resource links are search-backed and URL-validated before storage.
- Placeholder/blocked domains (e.g. `example.com`) are rejected.
- YouTube links are canonicalized and verified via oEmbed.
- Non-YouTube links must pass reachability checks (HEAD/GET fallback).

### Runtime Hardening
- Program detail and dashboard data paths now use direct server-side DB reads (no local loopback fetch dependency).
- Dynamic program route prebuild is disabled (`generateStaticParams` returns empty array) to avoid stale static output.

### Local Database Reset Workflow
For a safe local reset that re-syncs schema and regenerates Prisma client:

```bash
npm run db:push -- --force-reset
```

## 📊 Database Schema

### Core Tables
- `User` - User accounts and profiles
- `StudentProfile` - Student preferences and settings
- `OnboardingSession` - Admissions interview sessions
- `OnboardingAnswer` - Collected answers
- `Program` - Learning programs
- `Module` - Program modules
- `Lesson` - Individual lessons
- `Resource` - Curated learning resources
- `LessonNote` - Generated lesson content
- `ExerciseSet` - Practice exercises
- `ExerciseAttempt` - Student exercise submissions
- `Assessment` - Quizzes, tests, exams
- `AssessmentAttempt` - Assessment submissions
- `Schedule` - Program schedules
- `ScheduleItem` - Individual schedule items
- `Progress` - Student progress tracking
- `AgentRun` - Agent execution audit trail

## 🔄 Workflows

### Program Generation Workflow
1. Collect onboarding profile
2. Generate program blueprint (Curriculum Architect)
3. Validate and adjust if needed
4. Create program in database
5. Generate modules
6. Create lessons with resources (Resource Curator, Lesson Builder)
7. Generate exercises (Exercise Generator)
8. Generate assessments (Assessment Office)
9. Create schedule (Scheduler)
10. Update program status to ACTIVE

### Onboarding Workflow
1. Start new session
2. Ask questions one at a time
3. Collect answers
4. Generate final profile
5. Show summary and proposed program
6. Generate program on confirmation

## 🧪 Exercise Types

The system supports multiple exercise formats:

1. **MCQ** - Multiple choice questions
2. **True/False** - Binary choice questions
3. **Matching** - Pair matching exercises
4. **Cloze** - Fill-in-the-blank
5. **Short Answer** - Open-ended text responses
6. **Listening** - Audio/video comprehension
7. **Reading** - Text comprehension
8. **Speaking** - Recorded responses with rubrics
9. **Writing** - Written responses with rubrics

## 📝 Assessment Types

- **Quiz** - Low-stakes, lesson-level assessments
- **Test** - Module-level comprehensive assessments
- **Exam** - Program-level final assessments (midterm, final)

## 🎯 Key Design Principles

### School Experience (Not Chat)
- UX resembles: admissions desk → student profile → program enrollment → class calendar → daily agenda → lesson pages → homework/exercises → quizzes/tests/exams → gradebook → transcripts
- Chat exists only as a tutor/support panel, not the main product surface

### Dynamic Content (Minimal Hardcoding)
- No fixed courses - all generated dynamically
- Web search + resource curation for YouTube playlists, articles, open courses
- AI-authored scaffolding (learning objectives, outlines, practice sets, rubrics)
- Cached generated artifacts per course version for consistency

### Agentic System
- Multiple specialized agents act as school staff
- Agent tool use includes web search, summarization, quiz generation, grading, and planning
- Strict inputs/outputs with schema validation
- Deterministic IDs for reproducibility

## 🚧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:push -- --force-reset   # Reset local DB and re-sync schema
```

### Database Management

```bash
npx prisma db push      # Push schema changes
npx prisma db push --force-reset   # Reset local DB and push schema
npx prisma studio       # Visual database editor
npx prisma generate    # Regenerate Prisma Client
```

## 📚 Example Use Case: German A1 → B1

### Expected Program Characteristics
- 16 weeks intensive
- Daily:
  - 60-120m lecture videos
  - 60-120m drills (grammar/vocab)
  - 30-60m listening
  - 30-60m speaking/writing
  - Periodic quizzes/tests

### Example Day 1
- Lecture block: 5-10 short videos on greetings, pronunciation, basics
- Practice:
  - Matching greetings
  - Pronunciation prompts
  - Short dialog fill-in
- Homework:
  - Record 60-90 sec self-intro
- Quiz:
  - 10 Q check

## 🔐 Security Considerations

- All API routes should implement proper authentication
- User data should be properly validated
- OpenRouter API key should be kept secret
- NVIDIA NIM API key should be kept secret
- Database should be properly backed up in production

## 📄 License

This project is provided as-is for educational purposes.

## 🤝 Contributing

This is a demonstration project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

---

**Built with ❤️ using Next.js, Prisma, NVIDIA NIM, and OpenRouter**
# ai-education-system
# z
