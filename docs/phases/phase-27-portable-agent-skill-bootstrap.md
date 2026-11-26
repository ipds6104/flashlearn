# Phase 27: Portable Agent Skill Discovery, Self-Bootstrapping CLI & 1-Click "Copy Agent Skill"

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Referensi Standar Industri (November 2026)**:
  - **Agent Skills Open Standard (`agentskills.io`, Discovery Schema `v0.2.0`)**: Standar terbuka lintas-vendor (Antigravity/AGY, Claude Code, Cursor, GitHub Copilot, OpenAI Codex, OpenCode) untuk mendistribusikan skill modular (`SKILL.md` + `scripts/` + `references/`) dengan prinsip *progressive disclosure*.
  - **RFC 8615 `.well-known/agent-skills/index.json`**: Registri penemuan otomatis per-domain lengkap dengan *cryptographic digest* (`sha256:<hex>`) untuk mencegah manipulasi rantai pasok (*supply-chain drift*).
  - **Ecosystem CLI (`skills.sh` / `npx skills add`) & `/llms.txt`**: Jalur instalasi standar dari repositori GitHub publik serta indeks ringkas tingkat-situs untuk agen AI.
  - **Keamanan Kredensial (OWASP & Supply-Chain Hygiene 2026)**: Dilarang menyisipkan API Key di URL query string (rawan bocor ke access log / proxy / history); injeksi kredensial wajib lewat environment variable atau `flashlearn config set` (`chmod 0600` di `~/.flashlearn/config.json`) dan dilarang di-commit ke git.

---

## 1. Masalah As-Is
1. Tombol **"Copy for AI Agent"** di `ApiKeyModal.svelte` hanya muncul sesaat setelah membuat key baru dan hanya menyalin prompt REST API mentah lama (`POST /api/v1/contents`, hanya `materi`/`quiz`/`combined`).
2. Prompt lama tidak menyertakan:
   - Lokasi repositori resmi & daftar 4 Agent Skills (`.agents/skills/flashlearn-curriculum-pipeline`, `flashlearn-figure-extractor` beserta `scripts/extract_figures.py`, `flashlearn-domain-builder`, `flashlearn-domain-auditor`).
   - Cara instalasi mandiri `flashlearn` Agent-First CLI (`plan init/next/mark/push/diff/prune`, `workspace audit --strict`, `content import-project`, `asset upload`).
   - Alur lengkap pembuatan workspace modern (`interactive_module` UILA v2, `quiz` 600+ soal + flashcard 3D, `project_mission` karya nyata).
3. Server produksi (`Dockerfile` & `apps/api`) belum mengekspor `.agents/skills/` maupun bundel tunggal `flashlearn.js` CLI, sehingga coding agent di mesin baru tidak dapat melakukan *self-bootstrap* langsung dari instance FlashLearn yang sedang berjalan.

---

## 2. Arsitektur Solusi

### Fase 27.1 — Discovery & Self-Bootstrap Endpoints (`apps/api`)
1. **`AgentSkillCatalogService.ts`** (pure service dengan DI `rootDir`):
   - Memindai `.agents/skills/*/SKILL.md` beserta script pendamping di `scripts/*` (mis. `extract_figures.py`), mem-parsing YAML frontmatter, dan menghitung hash **`sha256`** deterministik.
   - Menghasilkan payload `/.well-known/agent-skills/index.json` sesuai schema `https://schemas.agentskills.io/discovery/0.2.0/schema.json` lengkap dengan `skills[]`, `resources[]`, `cli` metadata, dan `repository`.
   - Menegakkan *path-traversal guard* ketat pada setiap permintaan berkas skill/script.
2. **`AgentInstallerScriptBuilder.ts`**:
   - Menghasilkan installer idempoten lintas OS yang dapat diinspeksi sebelum dijalankan:
     - `GET /api/v1/agent/install.sh` (Linux / macOS / Termux / WSL)
     - `GET /api/v1/agent/install.ps1` (Windows PowerShell)
   - Alur installer: mengunduh seluruh skill + script dari `/.well-known/agent-skills/` → verifikasi `sha256` → pasang ke `~/.agents/skills/` (atau `./.agents/skills/` dengan `--project`) → unduh bundel tunggal `flashlearn.js` CLI + verifikasi `sha256` → buat shim `~/.local/bin/flashlearn` (atau `flashlearn.cmd` di Windows) → jika `FLASHLEARN_API_KEY` tersedia di environment, jalankan `flashlearn config set` (`chmod 0600`) & `flashlearn auth whoami`.
3. **`agent-bootstrap.controller.ts`**:
   - `GET /.well-known/agent-skills/index.json`
   - `GET /.well-known/agent-skills/:skill/SKILL.md`
   - `GET /.well-known/agent-skills/:skill/scripts/:filename`
   - `GET /llms.txt`
   - `GET /api/v1/agent/bootstrap` (metadata JSON untuk UI frontend)
   - `GET /api/v1/agent/cli/flashlearn.js` (bundel tunggal Bun CLI dengan header `X-Content-Sha256`)
   - `GET /api/v1/agent/install.sh` & `GET /api/v1/agent/install.ps1`

### Fase 27.2 — Pengemasan Produksi (`Dockerfile`)
- Menyertakan `packages/cli/package.json` pada layer `bun install --frozen-lockfile`.
- Menjalankan `bun run --cwd packages/cli build:bundle` saat Docker build menghasilkan bundel tunggal `packages/cli/dist/flashlearn.js`.
- Menyalin `.agents/skills` dan `packages/cli/dist/flashlearn.js` ke image `runner` dengan kepemilikan non-root (`USER bun`).

### Fase 27.3 — UI "Copy Agent Skill" (`apps/web`)
- **`apps/web/src/lib/agentSkillPrompt.ts`**: pembangun prompt bootstrap *progressive-disclosure* yang ringkas dan dapat langsung dieksekusi coding agent, mencakup:
  - Link discovery `/.well-known/agent-skills/index.json` & repositori GitHub resmi (`npx skills add <owner/repo> ...`).
  - Perintah 1-baris installer (`install.sh` / `install.ps1`) + opsi clone repo manual.
  - Daftar skill & script yang akan terpasang (`flashlearn-curriculum-pipeline`, `flashlearn-figure-extractor` + `scripts/extract_figures.py`, dll.).
  - Konfigurasi API Key aman via `flashlearn config set --base-url <origin> --api-key "<key>"` (tidak pernah lewat URL) & verifikasi `flashlearn auth whoami`.
  - Alur kerja kanonik pembuatan workspace lengkap hingga lulus `flashlearn workspace audit <slug> --strict`.
- **`ApiKeyModal.svelte`**:
  - Mengganti label **`Copy for AI Agent`** → **`Copy Agent Skill`** (`Copy Agent Skill (+ API Key)` saat key baru dibuat).
  - Menambahkan kartu **"Pasang ke Coding Agent (Copy Agent Skill)"** yang selalu tersedia kapan saja (bahkan tanpa harus membuat API Key baru), lengkap dengan tautan inspeksi `/.well-known/agent-skills/index.json` dan repositori GitHub.

---

## 3. Kriteria Verifikasi
- Unit test lulus (`apps/api/tests/agent_bootstrap.test.ts` & `apps/web/tests/agent_skill_prompt.test.ts`): validasi skema `v0.2.0`, integritas `sha256`, penolakan *path traversal* (`../`), nol API Key dalam URL, dan validitas prompt/installer.
- `bun run --cwd packages/cli build:bundle`, `apps/web` `bun run build`, `bun run lint:srp`, dan `arc42-lint --strict` lulus 0 error.
- Verifikasi langsung endpoint produksi di `https://learn.dvlpid.my.id/.well-known/agent-skills/index.json`, `/llms.txt`, `/api/v1/agent/install.sh`, dan `/api/v1/agent/cli/flashlearn.js` mengembalikan `HTTP 200`.
