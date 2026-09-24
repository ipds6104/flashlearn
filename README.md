# ⚡ FlashLearn

> **Active-Recall Educational Platform** combining Material Reading, Interactive Quizzes, and Instant 3D Flashcards. Built with **Bun**, **TypeScript**, **Elysia.js**, **PostgreSQL (Drizzle ORM)**, **Svelte 5**, and **Framework7 v9.1.3**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-v1.4+-black.svg)](https://bun.sh)
[![Svelte](https://img.shields.io/badge/Svelte-5.0+-orange.svg)](https://svelte.dev)
[![Framework7](https://img.shields.io/badge/Framework7-v9.1.3-red.svg)](https://framework7.io)
[![Architecture](https://img.shields.io/badge/Architecture-Hexagonal%20%2F%20Ports%20%26%20Adapters-teal.svg)](docs/architecture-hexagonal.md)

---

## ✨ Features

- **Triple Content Modes**:
  1. 📖 **Materi Saja**: Structured reading units with code highlights, estimated reading time, and key takeaways.
  2. 📝 **Quiz Saja**: Interactive single/multi-choice assessments with immediate feedback and scoring.
  3. 📚 **Materi & Quiz Digabung**: Sequenced learning units where theoretical readings flow directly into knowledge-check quizzes.
- **⚡ Instant 3D Post-Quiz Flashcards**:
  - Once any quiz is finished, tap **"Buka Flashcard"** to immediately convert all quiz questions into a tactile 3D flip card deck.
  - Review misconceptions, flip cards with physical depth, and grade recall (*Again, Hard, Good, Easy*).
- **👥 3-Tier Role-Based Access Control (RBAC)**:
  - **Guest**: No login required. Can browse public workspaces, read materials, take quizzes, and study flashcards friction-free.
  - **Creator**: Google OAuth authenticated. Can create isolated workspaces, author contents, and generate scoped API keys.
  - **Superadmin**: Full system governance. Can view, audit, and edit any workspace across the entire platform.
- **🔑 Developer API Key Engine**:
  - Creators and Superadmins can generate scoped API keys (`fl_live_...`) to perform programmatic CRUD via REST.
- **📐 Hexagonal Architecture & Clean Code**:
  - Interface-First design, strict Dependency Injection (DI), Single Responsibility Principle (SRP).
  - Pure domain layer decoupled from database and web frameworks.
- **📖 Interactive OpenAPI 3.1 & Scalar Docs**:
  - Fully typed, standardized REST API with dynamic interactive documentation at `/docs`.
- **🎨 Impeccable Design System**:
  - Engineered with Paul Bakaus's Impeccable standards to eliminate generic "AI slop".
  - High-contrast typography (*Plus Jakarta Sans* + *Inter*), rich tactile micro-interactions, and adaptive iOS/MD themes via Framework7.

---

## 🏗️ Repository Architecture (Monorepo)

```
flashlearn/
├── apps/
│   ├── api/                  # Bun + Elysia.js + Hexagonal Backend
│   │   ├── src/
│   │   │   ├── domain/       # Entities, Value Objects, Ports (Interfaces)
│   │   │   ├── application/  # Single Responsibility Use Cases
│   │   │   └── infrastructure/# Drizzle Repositories, Google OAuth, DI, HTTP Routes
│   │   └── package.json
│   └── web/                  # Svelte 5 + Framework7 v9.1.3 + Vite Frontend
│       ├── src/
│       │   ├── components/   # Tactile 3D Flashcards, Quiz Runners, Material Views
│       │   ├── pages/        # Workspaces, Content Viewer, Auth, Admin & Creator Panels
│       │   └── stores/       # Svelte 5 Rune-based state stores
│       └── package.json
├── packages/
│   └── shared/               # Shared TypeScript types, DTOs, TypeBox schemas
│       └── src/
├── docs/                     # Detailed architectural and user-flow specifications
│   ├── user-flow-guest.md
│   ├── user-flow-creator.md
│   ├── user-flow-superadmin.md
│   └── architecture-hexagonal.md
├── PRODUCT.md                # Impeccable Product Truth specification
├── DESIGN.md                 # Impeccable Visual Design Tokens & Guidelines
├── GEMINI.md                 # Agent and developer environment rules
└── package.json              # Monorepo root workspaces config
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.2+) installed
- PostgreSQL 16 running on `localhost:5432`

### Setup Instructions

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/ipds6104/flashlearn.git
   cd flashlearn
   bun install
   ```

2. **Configure Environment Variables**:
   In `apps/api/.env`:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://postgres:your-db-password@localhost:5432/flashlearn
   JWT_SECRET=your-secure-jwt-secret
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SUPERADMIN_EMAILS=ihza2karunia@gmail.com,admin@dvlpid.my.id
   ```

   In `apps/web/.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

3. **Run Database Migrations**:
   ```bash
   cd apps/api
   bun run db:push
   bun run db:seed
   ```

4. **Start the Development Servers**:
   ```bash
   # From root:
   bun run dev
   ```
   - Web Application: `http://localhost:5173`
   - Backend API: `http://localhost:3000`
   - OpenAPI Scalar Documentation: `http://localhost:3000/docs`

---

## 📚 User Flows & Documentation
- [Guest User Flow](docs/user-flow-guest.md)
- [Creator User Flow](docs/user-flow-creator.md)
- [Superadmin User Flow](docs/user-flow-superadmin.md)
- [Hexagonal Architecture Deep Dive](docs/architecture-hexagonal.md)

---

## 📄 License
This project is licensed under the MIT License.
