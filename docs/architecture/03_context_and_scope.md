---
arc42_section: 3
verified_commit: "87ba248"
verified_timestamp: "2026-11-26T10:22:27Z"
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 3. Context and Scope

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `0ae4951` (branch: `main`)
> - **Verified Timestamp**: `2026-11-25T09:23:22Z`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section defines the external boundaries of the FlashLearn platform, identifying interacting human users, autonomous agents, and upstream/downstream external systems.

---

## 3.1 Business Context (C4 Context Diagram)

```mermaid
graph TD
    User["Learner / Candidate"] -->|"IF-01: Practices & Takes Gate Exams"| System["FlashLearn Platform"]
    Creator["Subject Matter Expert / Creator"] -->|"IF-01: Imports Blueprints & Manages Curricula"| System
    AgentCLI["Autonomous AI Agent / CI Runner"] -->|"IF-02: Deterministic CLI Operations"| System

    System -->|"IF-03: Relational Storage & Master Ledgers"| Database[("PostgreSQL Database")]
    System -->|"IF-04: Grounded Oracle, Lesson Gen & Socratic LLM"| AIGateway["AI Gateway Service (OpenAI-Compatible)"]
    System -->|"IF-05: W3C VC Public Verification"| VerifierPortal["Public Verification Portal"]
    System -->|"IF-06: Periodic Drift Decay & Source Polling"| Worker["Background Worker Daemon"]
```

---

## 3.2 Technical Context & Interface Matrix

| Interface ID | Partner | Protocol / Format | What Goes In (Input) | What Goes Out (Output) |
|---|---|---|---|---|
| IF-01 | Web Browser | HTTP/2, JSON, SSE | User gestures, attempt submissions, Socratic chat messages, JWT/OAuth tokens | Svelte 5 SPA assets, DAG states, learning bundles, SSE chat tokens (`/api/v1/socratic/stream`) |
| IF-02 | Agent CLI (`flashlearn`) | HTTP REST, JSON | CLI commands (`bun run cli` / `flashlearn`), `Authorization: Bearer` / `x-api-key` headers, blueprint JSON | Structured JSON envelopes (`schemaVersion`, `status`, `data`, `nextActions`) and deterministic exit codes |
| IF-03 | PostgreSQL Engine | TCP, PostgreSQL Wire | Drizzle parameterized SQL queries (`db.select()`/`insert`/`update`), advisory-locked migrations | Relational rowsets, transaction commits, connection pool health |
| IF-04 | AI Gateway (Lumis / 9router / OpenAI-compatible) | HTTPS, JSON & SSE | OpenAI-compatible `/chat/completions` payloads (system prompt, multi-turn history, optional `json_object` mode) and `/models` health probes | Structured Oracle Class B / Adversarial JSON verdicts, verified lesson drafts, Socratic responses & SSE streams |
| IF-05 | External Verifiers / HR | HTTPS, JSON / JSON-LD | Public passport grant ID (`/api/v1/gates/verify/:grantId`) or W3C VC 2.0 JSON payload (`/api/v1/credentials/verify`) | Cryptographic Ed25519 verification result, issuer DID metadata, active/revoked status |
| IF-06 | Background Worker Daemon | In-Process Event Loop / CLI `--once` | Periodic 60s tick (embedded in `apps/api/src/index.ts` or standalone `bun run worker`) | Competency drift decay recalculations (`ProcessCompetencyDecayBatchUseCase`), provisional gate suspensions, source health counts |

---

## 3.3 Scope Boundaries: In-Scope vs. Out-of-Scope

### In-Scope
- Guided interactive comprehension modules (`interactive_module`, UILA v2, Clement–Brown Bridging Analogies, sandboxed HTML slide decks & micro-sims) with guest + authenticated auto-resume (`learner_content_progress`).
- Scalable Active Recall materials, 10–600+ interleaved quizzes (`quiz`, `combined`), 3D tactile flashcards with Leitner Re-Queue, and SM-2 spaced repetition (`SpacedRepetitionScheduler`).
- Independent Practice & Authentic Project Missions (`project_mission`, `project_mission_submissions`) with Single-Point Self-Audit Rubrics, Proof-of-Work persistence, and optional fail-fast AI Mentor critique (`POST /api/v1/contents/:id/project-critique`).
- Deterministic CLI curriculum compilation (`flashlearn plan init/push/diff/prune/pull`), standalone project mission import (`flashlearn content import-project`), and workspace completeness auditing (`flashlearn workspace audit --strict`).
- Backend-only internal competency engine APIs (DAG, multi-tier oracles, W3C VC 2.0) retained for internal document/SOP compliance domains (stripped from primary learner workspace UI in Phase 25 to keep learner UX focused).

### Out-of-Scope
- Statutory or physical life-safety licensing & authorization (e.g., clinical surgery, medical practice licenses, aircraft/aviation airworthiness or pilot licensing). Web + LLM evaluation cannot certify physical psychomotor skills or supersede state regulators.
- Direct hosting or transcoding of large video/audio media streams.
- Native mobile binary builds (addressed via responsive Framework7 mobile web UI).
- Proprietary LLM model training or local model weight hosting (FlashLearn connects strictly to external OpenAI-compatible LLM gateways via `IAiGateway`).
