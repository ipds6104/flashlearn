# Phase 28: Workspace Mastery Orientation ("Orientasi Keunggulan & Peta Realitas")

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Landasan Ilmu Belajar (November 2026)**:
  - **Advance Organizers (Ausubel)**: Pengantar di awal workspace bukan sekadar daftar isi, melainkan kerangka konseptual tingkat tinggi (*expository* & *comparative organizer*) yang memberi jangkar tempat menempel bagi seluruh detail materi berikutnya.
  - **Expectancy-Value Theory (Eccles & Wigfield)**: Motivasi belajar mendalam merupakan hasil kali *Expectancy* (keyakinan bisa berhasil lewat jalur jelas) dan *Value* (nilai nyata dari karya/keunggulan yang bisa dicapai).
  - **Dreyfus Model of Skill Acquisition & Tacit Knowledge**: Kursus/workspace mandiri sangat kuat membawa pembelajar dari *Novice* → *Competent* (model mental eksplisit, *worked exemplars*, *active recall*, & *project missions*), tetapi memiliki **batas struktural** untuk *tacit knowledge* (*Proficient* → *Expert*) yang hanya lahir dari paparan risiko nyata, umpan balik adaptif lintas tahun, dan dinamika organisasi. Transparansi batas ini mencegah *illusion of competence* dan memberi peta jalan lanjutan yang jujur.
  - **Exemplar Non-Tokoh**: Keunggulan (*excellence*) tidak selalu diwakili oleh figur individu; bisa berupa **sistem, protokol, tim rekayasa, organisasi, atau karya kanonik** (mis. komunitas Linux Kernel, meja *market-making* institusional, standar RFC/POSIX, sistem produksi modern).

---

## 1. Masalah As-Is (Hasil Audit Skill & Codebase)
1. Entitas `Workspace` hanya memiliki `description` teks datar satu paragraf — belum ada struktur *Mastery Orientation* yang menjawab:
   - Apa ciri-ciri keunggulan (*hallmarks of excellence*) di bidang ini?
   - Apa *magnum opus* / karya nyata monumental yang dicapai (baik oleh sistem, organisasi, tim, protokol, maupun praktisi)?
   - Aspek keunggulan apa yang **benar-benar bisa dicapai** lewat workspace ini secara komprehensif?
   - Apa yang **tidak mungkin didapatkan** hanya dengan mengerjakan workspace ini saja, beserta rekomendasi konkret di luar workspace?
2. `workspace-completeness-auditor.ts` belum memiliki gerbang deterministik untuk mendeteksi workspace tanpa *Mastery Orientation*.
3. Skill `flashlearn-curriculum-pipeline/SKILL.md` belum mewajibkan penyusunan *Mastery Orientation* saat membuat atau mengaudit workspace.

---

## 2. Arsitektur Solusi (Expand-Only Zero-Downtime + Hexagonal)

### A. Shared Contract, Validator & Auditor (`packages/shared`)
- Kontrak `WorkspaceOrientationPayload` (`schemaVersion: 'workspace-orientation-v1'`) dengan 4 pilar wajib:
  1. `hallmarksOfExcellence[]` ($\ge 3$ butir: `trait`, `indicator`, `contrastWithNovice?`)
  2. `magnumOpusExamples[]` ($\ge 2$ butir: `exemplarName`, `exemplarKind: 'system' | 'organization' | 'team' | 'protocol' | 'practitioner' | 'work'`, `achievement`, `knowledgeApplied`)
  3. `achievableHere[]` ($\ge 2$ butir: `capability`, `evidenceInWorkspace`)
  4. `honestLimits[]` ($\ge 2$ butir: `limit`, `whyBeyondWorkspace`, `recommendation`)
- `validateWorkspaceOrientationPayload()` — validator deterministik.
- `auditWorkspaceCompleteness()` — menambahkan pemeriksaan `MISSING_MASTERY_ORIENTATION` & `INVALID_MASTERY_ORIENTATION` dengan perintah perbaikan otomatis `flashlearn workspace update <id> --orientation ./orientation.json`.

### B. Database & Backend (`apps/api`)
- **Migrasi Expand-Only (`0013_workspace_mastery_orientation.sql`)**:
  - `ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "orientation_payload" jsonb;`
- Dukungan penuh `orientationPayload` pada `WorkspaceEntity`, `DrizzleWorkspaceRepository`, `UpdateWorkspaceUseCase` (dengan validasi ketat), dan `workspace.controller.ts`.

### C. Frontend UX (`apps/web`)
- `WorkspaceOrientationCard.svelte` (< 180 baris): kartu **"Orientasi Keunggulan & Peta Realitas"** yang tenang dan dapat dilipat/dibuka 1-ketuk tepat di bawah `WorkspaceHeader` sehingga memberi *Advance Organizer* tanpa mendorong daftar modul keluar layar HP.

### D. CLI, Skill & Backfill Produksi
- `flashlearn workspace update <id-atau-slug> --orientation ./orientation.json` (validasi lokal + kirim via API).
- Pembaruan `.agents/skills/flashlearn-curriculum-pipeline/SKILL.md` (Layer 0: Mastery Orientation).
- Backfill seluruh workspace aktif di produksi menggunakan sumber aslinya hingga seluruhnya lolos `flashlearn workspace audit <slug> --strict` (`100/100 COMPLETE`).
