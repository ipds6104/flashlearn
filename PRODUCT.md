# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Bun (Runtime & Package Manager), Elysia.js (Backend Framework with OpenAPI 3.1 & Scalar Docs), PostgreSQL (Drizzle ORM), Svelte 5 (Runes Reactivity) with Framework7 v9.1.3 (Mobile-first iOS/Material UI) in a Monorepo setup (`apps/api`, `apps/web`, `packages/shared`).

## Users

1. **Guest (Public Learner)**: Students, curious learners, or anonymous visitors who access learning modules or quizzes via shared public links. They learn friction-free without account registration, test their knowledge with interactive quizzes, and immediately review weak points using instant 3D flashcards.
2. **Creator (Content Author / Teacher)**: Educators, trainers, content creators who organize educational content into Workspaces. They author Material-only, Quiz-only, or Combined Material+Quiz units, manage publishing status, view workspace analytics, and generate scoped API keys for automated content syndication/integration.
3. **Superadmin (System Administrator)**: Platform operators who have complete cross-workspace governance, user management, system-wide CRUD, global API key generation, and compliance auditing.

## Product Purpose

FlashLearn is an active learning and authentic-practice platform designed to eliminate *Tutorial Hell* and *Imposter Syndrome* by guiding learners through three connected stages: **Deep Comprehension** (Interactive Bridging Modules & structured reading), **Active Recall** (scalable 10–600+ question drills & tactile 3D Flashcards), and **Authentic Practice** (Independent Project Missions — `mini_practice` & `capstone` studios with real-world deliverables and single-point self-audit rubrics).

## Positioning

Unlike traditional LMSs that bury quizzes behind passive lectures or flashcard apps (Anki/Quizlet) that stop at memorization without real-world execution, FlashLearn unifies Guided Interactive Comprehension (`interactive_module`), Scalable Active Recall (`quiz` + 3D Flashcards), and Independent Proof-of-Work Studios (`project_mission`) in a single zero-friction workspace — verified deterministically via CLI (`flashlearn workspace audit`).

## Operating Context

- Mobile web and desktop web optimized via Framework7's adaptive iOS/MD (Material Design) themes.
- Used in classrooms, self-study sessions, on-the-go smartphone micro-learning, and developer integrations via RESTful OpenAPI endpoints.
- Authentication relies on Google Identity Services (GIS) OAuth verification, matching Cerdas credentials for seamless single sign-on.
- Programmatic automation enabled via Scoped API Keys (`fl_live_...`) with fine-grained RBAC for Creators and Superadmins.

## Capabilities and Constraints

### Capabilities:
- **Workspaces**: Creators organize contents into dedicated workspaces; Superadmins can audit and manage any workspace.
- **Three Content Modes**:
  1. *Materi Saja*: Rich structured markdown/media reading materials with reading time estimates and key takeaways.
  2. *Quiz Saja*: Interactive single/multi-choice questions with real-time feedback, explanations, and score tracking.
  3. *Materi & Quiz Digabung*: Guided sequential module where theoretical materials are directly followed by checkpoint quizzes.
- **Post-Quiz 3D Flashcard Engine**: At the conclusion of any quiz, a dedicated action converts all questions into a tactile, flip-card study deck with mastery tagging (*Again / Hard / Good / Easy*).
- **Role-Based Access Control (RBAC)**:
  - `Guest`: Public read & interactive quiz/flashcard execution.
  - `Creator`: Isolated workspace CRUD, content authoring, API key generation.
  - `Superadmin`: Universal workspace CRUD, user role management, system health, master API keys.
- **Enterprise-Grade API**:
  - OpenAPI 3.1 specification powered by Elysia & Scalar interactive documentation.
  - Hexagonal Architecture (Ports and Adapters), strict Dependency Injection, Single Responsibility Principle (SRP), and Interface-First design.
  - SHA-256 hashed Scoped API Keys with role verification and rate-limiting.

### Technical Constraints:
- Database: PostgreSQL on port 5432 with Drizzle ORM migrations.
- Google OAuth: GIS client token verification on `/api/v1/auth/google`.
- UI: Framework7 Svelte v9.1.3 utilizing Svelte 5 runes (`$state`, `$derived`, `$props`).

## Brand Commitments

- **Tone & Identity**: Focused, energetic, clear, tactile, and frictionless.
- **Visual Design Standard**: Strict adherence to Impeccable principles—avoiding generic "AI slop" (cliché purples, monotonous gray cards, low-contrast text).
- **Physicality**: Tactile 3D card flips with CSS perspective, iOS smooth elastic scrolling, crisp typography hierarchy, and deliberate micro-interactions.

## Evidence on Hand

- Google OAuth client credentials verified from production Coolify/Cerdas stack (`your-google-client-id.apps.googleusercontent.com`).
- Local PostgreSQL instance 16.14 verified and database `flashlearn` initialized.
- GitHub repository configured under `https://github.com/ipds6104/flashlearn`.

## Product Principles

1. **Frictionless Active Recall**: No learner should be blocked by login walls to test their knowledge. Quizzes lead immediately to flashcards.
2. **Modular Hexagonal Purity**: Core domain logic and learning models remain entirely decoupled from HTTP frameworks or database drivers.
3. **Tactile Craft Over Template Slop**: Every interaction (swiping cards, flipping answers, picking choices) feels physical, snappy, and intentional.
4. **Developer-First API Parity**: Every action doable in the Web UI is 100% accessible via documented, typed REST APIs using API Keys.
