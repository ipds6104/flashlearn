# FlashLearn Developer Rules & Architecture Guide

Welcome to **FlashLearn**, an active-recall learning application built with Bun, TypeScript, Elysia.js, PostgreSQL (Drizzle ORM), Svelte 5, and Framework7 v9.1.3.

## 🚀 Quick Reference Commands
- **Install dependencies**: `bun install`
- **Run dev environment (all apps)**: `bun run dev`
- **Run backend API only**: `cd apps/api && bun run dev` (Runs on `http://localhost:3000`)
- **Run frontend Web only**: `cd apps/web && bun run dev` (Runs on `http://localhost:5173`)
- **Database migrations**: `cd apps/api && bun run db:push`
- **API Documentation**: `http://localhost:3000/docs` (Scalar UI) or `http://localhost:3000/swagger`
- **Run Impeccable detector**: `npx impeccable detect`

---

## 🏛️ Architecture & Clean Code Mandates

### 1. Hexagonal Architecture (Ports & Adapters)
All backend logic in `apps/api` strictly conforms to Hexagonal boundaries:
- `src/domain/`: Pure domain entities, value objects, and repository ports (interfaces). No external dependencies.
- `src/application/use-cases/`: Single Responsibility Use Cases. Depends ONLY on domain ports.
- `src/infrastructure/`: Concrete adapters (Drizzle ORM, Google OAuth verifier, JWT token service, DI container, Elysia HTTP routes & controllers).

### 2. Dependency Injection & Interface-First
- NEVER instantiate repositories or services directly inside use cases or HTTP handlers.
- ALWAYS define an interface in `src/domain/ports/` before writing its implementation.
- Wire all implementations through the central DI container: `src/infrastructure/di/container.ts`.

### 3. Role-Based Access Control (RBAC)
- **`guest`**: Unauthenticated public learner. Can view public workspaces, read materials, take quizzes, and study generated flashcards.
- **`creator`**: Authenticated content author. Can create and manage their own workspaces, author materials/quizzes, and issue scoped API keys. Cannot edit other creators' workspaces.
- **`superadmin`**: System administrator. Can view, edit, and moderate ANY workspace in the entire database, manage user roles, and generate master API keys.

### 4. API Keys & Programmatic CRUD
- Keys are formatted as `fl_live_<random_bytes>`.
- The secret key is hashed with SHA-256 before storage in PostgreSQL (`api_keys` table).
- API requests authenticate via `Authorization: Bearer fl_live_...` or standard JWT.

### 5. Google OAuth Integration
- Client ID & Secret configured in `apps/api/.env` (shared with Cerdas stack in Infisical / Coolify).
- Flow: Frontend obtains ID Token (credential) via Google Identity Services (`gsi/client`) and posts to `/api/v1/auth/google`. The backend validates the cryptographic signature against Google's public JWKS.

---

## 🎨 Impeccable Design & Frontend Discipline

- **No AI Slop**: Avoid purple gradient clichés, washed-out low-contrast gray text, and generic card grids.
- **Framework7 Svelte 5**: Use Framework7 v9.1.3 components with modern Svelte 5 runes (`$state`, `$derived`, `$props`).
- **Tactile Flashcard Physics**: Smooth 3D Y-axis card flip (`perspective: 1000px`, `transform-style: preserve-3d`) with spring transitions.
- **Design Tokens**: Defined in `DESIGN.md` and `PRODUCT.md`.

---

## 🗄️ Database Configuration
- **Database**: PostgreSQL 16
- **Host**: `localhost:5432`
- **Database Name**: `flashlearn`
- **Username**: `postgres`
- **Password**: `T1sy7cEhciZI4FeMSCc6JzwkBcokqA4ubRBNVmRhLZWLrvKEoGjsORiF6nIoRcSl`
- **Connection URI**:
  ```
  postgresql://postgres:T1sy7cEhciZI4FeMSCc6JzwkBcokqA4ubRBNVmRhLZWLrvKEoGjsORiF6nIoRcSl@localhost:5432/flashlearn
  ```
