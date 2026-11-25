# Phase 25: Independent Practice & Authentic Project Missions (`project_mission`)

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Prinsip Ilmu Belajar (2026)**:
  - **Escape Tutorial Hell & Imposter Syndrome**: Modul interaktif, kuis, dan flashcard 3D membangun pemahaman (*Understand*) dan ingatan (*Remember*), tetapi transfer sejati (*Far Transfer*) hanya terjadi saat pembelajar membangun **Authentic Deliverable** di luar lingkungan soal tertutup.
  - **Scaffolded Fade**: Bertahap dari **Mini-Praktek Unit** (`mini_practice`, 15–45 menit, *half-open door* dengan konteks awal terarah) menuju **Proyek Karya Akhir Workspace** (`capstone`, 60–240+ menit, *blank canvas* penuh berbekal brief nyata, batasan, *edge cases*, dan *Single-Point Self-Audit Rubric*).
  - **Zero-Friction, High-Reward**: Tidak memblokir akses baca materi; mendukung pengguna login maupun tamu (*guest*) via `x-learner-session`; validasi mandiri tetap 100% bisa diselesaikan secara deterministik meski layanan AI sedang tidak aktif.

---

## 1. Masalah As-Is
1. Setelah menghapus UI *Tier 2* (*Peta Kompetensi* & *Paspor Gerbang*) yang terlalu birokratis untuk pembelajaran umum/buku, workspace hanya berisi konsumsi materi (`interactive_module`, `materi`) dan latihan soal (`quiz`, `combined`).
2. Pembelajar berisiko terjebak *tutorial hell* (tamat membaca/kuis, tetapi membeku saat diminta membuat karya nyata seperti aplikasi web, dokumen ADR, atau lembar analisis keuangan sendiri).
3. Skill `flashlearn-curriculum-pipeline` & CLI `flashlearn plan push` belum memiliki tipe konten khusus untuk misi praktek mandiri / studi kasus karya nyata.

---

## 2. Arsitektur Solusi (Hexagonal + Expand-Only Zero-Downtime)

### A. Shared Contract & Validator (`packages/shared`)
- Tambah `ContentType = 'materi' | 'quiz' | 'combined' | 'interactive_module' | 'project_mission'`.
- Tambah `ProjectMissionPayload` (`schemaVersion: 'project-mission-v1'`):
  - `missionLevel`: `'mini_practice' | 'capstone'`
  - `domainCategory`, `estimatedMinutes`, `realWorldBrief`, `authenticDeliverable`, `starterContext?`
  - `constraints[]`, `edgeCasesToTest[]`, `milestones[]`, `selfAuditRubric[]` (*Single-Point Rubric*: `criterion`, `verificationMethod`, `redFlag?`), `stretchGoals?`, `relatedConcepts?`, `unitMeta?`
- `validateProjectMissionPayload()` — validasi deterministik struktur manifest misi.
- `validateSafeArtifactUrl()` — proteksi XSS ketat (hanya mengizinkan protokol `http://` atau `https://`, menolak `javascript:`, `data:`, dll.).
- `formatProjectMissionToMarkdown()` — terintegrasi otomatis dengan fitur 1-klik **Salin Full Materi (MD)**.

### B. Database & Backend Hexagonal (`apps/api`)
- **Migrasi Expand-Only (`0012_project_mission_studio.sql`)**:
  - `ALTER TABLE contents ADD COLUMN IF NOT EXISTS project_payload jsonb;`
  - `CREATE TABLE IF NOT EXISTS project_mission_submissions (...)` untuk menyimpan progres milestone, ceklis rubrik mandiri, URL artefak karya, ringkasan keputusan, refleksi pribadi, serta hasil kritik mentor AI opsional.
- **Port & Adapter**: `IProjectSubmissionRepository` + `DrizzleProjectSubmissionRepository`.
- **Use Cases (SRP)**:
  - `GetProjectSubmissionUseCase`: memuat progres karya pembelajar (auth atau guest `x-learner-session`).
  - `SaveProjectSubmissionUseCase`: validasi URL aman, penegakan syarat selesai (*seluruh butir rubrik mandiri tercentang + minimal ada URL karya atau ringkasan karya >= 20 karakter*), serta sinkronisasi otomatis ke `learner_content_progress` agar progress bar Workspace & Home ikut terbarui.
  - `CritiqueProjectSubmissionUseCase`: kritik non-spoiler opsional berbasis `IAiGateway` terhadap *brief*, *constraints*, *edge cases*, dan *rubric* (fail-fast `503` jika AI gateway offline — nol mock/stub palsu).
- **Endpoints (`project-mission.controller.ts`)**:
  - `GET /api/v1/contents/:id/project-submission`
  - `PUT /api/v1/contents/:id/project-submission`
  - `POST /api/v1/contents/:id/project-critique` (rate-limited)

### C. Frontend Studio Karya (`apps/web`, < 200 baris/komponen)
- `ProjectMissionViewer.svelte` — orkestrator halaman misi praktek mandiri.
- `ProjectBriefCard.svelte` — brief dunia nyata (Markdown aman via DOMPurify), wujud artefak target, konteks awal, batasan, dan daftar *edge cases*.
- `ProjectRubricChecklist.svelte` — tonggak progres + *Single-Point Self-Audit Rubric* dengan progress bar GPU (`scaleX`).
- `ProjectProofOfWorkCard.svelte` — formulir tautan karya, ringkasan keputusan, refleksi mandiri, tombol simpan/selesaikan (+ selebrasi audio-visual Phase 24), dan panel kritik Mentor AI opsional.
- Integrasi penuh pada `content-detail.svelte`, `workspace.svelte`, `WorkspaceFilterBar.svelte`, `WorkspaceUnitAccordion.svelte`, dan `ContentListItem.svelte`.

### D. Agent CLI & Curriculum Pipeline (`packages/cli` + `.agents/skills/`)
- `project-mission-pusher.ts`: mendukung `contentType: 'project_mission'` (manifest `project-mission-v1`) di `flashlearn plan push --dry-run` maupun live push secara idempoten.
- Pembaruan `.agents/skills/flashlearn-curriculum-pipeline/SKILL.md`: menambahkan panduan authoring Misi Praktek Mandiri (`mini_practice` per unit & `capstone` akhir workspace).

---

## 3. Kriteria Verifikasi
- Unit test lulus di `packages/shared`, `packages/cli`, dan `apps/api` (validator payload, XSS URL guard, enforcement rubrik completion, sync progres, dan fail-fast AI critique).
- Migrasi Drizzle berjalan bersih pada PostgreSQL lokal (`bun run db:migrate` + `bun run db:seed`).
- `bun --filter @flashlearn/web build`, `tsc --noEmit`, dan `bun run lint:srp` lulus 0 error.
