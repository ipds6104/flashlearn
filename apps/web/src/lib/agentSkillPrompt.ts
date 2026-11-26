export interface AgentBootstrapMetadata {
  repository?: {
    url: string;
    slug: string;
    skillsAddCommand: string;
  };
  cli?: {
    available: boolean;
    bundleUrl: string;
    installShUrl: string;
    installPs1Url: string;
  };
  skills?: Array<{
    name: string;
    description: string;
    url: string;
    role?: 'primary' | 'companion' | 'internal';
    resources?: Array<{ path: string; url: string }>;
  }>;
}

const DEFAULT_REPO_URL = 'https://github.com/ipds6104/flashlearn';
const DEFAULT_REPO_SLUG = 'ipds6104/flashlearn';

export function buildAgentSkillPrompt(opts: {
  origin: string;
  apiKey?: string | null;
  metadata?: AgentBootstrapMetadata | null;
}): string {
  const origin = opts.origin.replace(/\/+$/, '');
  const repoUrl = opts.metadata?.repository?.url || DEFAULT_REPO_URL;
  const repoSlug = opts.metadata?.repository?.slug || DEFAULT_REPO_SLUG;
  const skillsAddCmd =
    opts.metadata?.repository?.skillsAddCommand ||
    `npx skills add ${repoSlug} --skill flashlearn-curriculum-pipeline --skill flashlearn-figure-extractor`;
  const installShUrl = opts.metadata?.cli?.installShUrl || `${origin}/api/v1/agent/install.sh`;
  const installPs1Url = opts.metadata?.cli?.installPs1Url || `${origin}/api/v1/agent/install.ps1`;
  const discoveryUrl = `${origin}/.well-known/agent-skills/index.json`;
  const hasRealKey = Boolean(opts.apiKey && opts.apiKey.trim().length > 0);
  const keyValue = hasRealKey ? opts.apiKey!.trim() : '<ISI_API_KEY_FLASHLEARN_ANDA>';

  const skillList =
    opts.metadata?.skills && opts.metadata.skills.length > 0
      ? opts.metadata.skills
          .map((s) => {
            const scripts = (s.resources || []).map((r) => r.path).join(', ');
            return `- \`${s.name}\`${scripts ? ` (+ \`${scripts}\`)` : ''} — ${s.url}`;
          })
          .join('\n')
      : [
          `- \`flashlearn-curriculum-pipeline\` (Skill Utama pembuatan workspace, modul UILA v2, kuis 600+ soal, & misi praktek mandiri) — ${origin}/.well-known/agent-skills/flashlearn-curriculum-pipeline/SKILL.md`,
          `- \`flashlearn-figure-extractor\` (+ \`scripts/extract_figures.py\` ekstraksi gambar/diagram PDF/EPUB/PPTX ke WebP) — ${origin}/.well-known/agent-skills/flashlearn-figure-extractor/SKILL.md`,
          `- \`flashlearn-domain-builder\` — ${origin}/.well-known/agent-skills/flashlearn-domain-builder/SKILL.md`,
          `- \`flashlearn-domain-auditor\` — ${origin}/.well-known/agent-skills/flashlearn-domain-auditor/SKILL.md`,
        ].join('\n');

  return `# FlashLearn Agent Skill Bootstrap

Pasang seluruh **FlashLearn Agent Skills**, helper script, dan **Agent-First CLI (\`flashlearn\`)** pada lingkungan coding agent ini agar kamu bisa merancang, membuat, mengaudit, dan mempublikasikan workspace pembelajaran secara mandiri.

## 1. Sumber Resmi & Discovery (agentskills.io v0.2.0)
- **Server FlashLearn**: \`${origin}\`
- **Agent Skills Discovery Index (JSON + SHA-256)**: \`${discoveryUrl}\`
- **Repositori GitHub Resmi (Skills, Scripts & CLI)**: \`${repoUrl}\`
- **LLM Site Index**: \`${origin}/llms.txt\`
- **OpenAPI Docs**: \`${origin}/docs\`

### Paket Skill & Script yang Akan Terpasang
${skillList}

## 2. Pasang Otomatis (Pilih Sesuai OS)
Periksa isi installer jika perlu (\`curl -fsSL ${installShUrl}\`), lalu jalankan untuk mengunduh semua skill, \`scripts/extract_figures.py\`, dan bundel CLI \`flashlearn\` (terverifikasi SHA-256) ke \`~/.agents/skills/\` & \`~/.local/bin/flashlearn\`:

- **Linux / macOS / Termux / WSL**:
  \`\`\`bash
  curl -fsSL ${installShUrl} | bash
  \`\`\`
- **Windows (PowerShell)**:
  \`\`\`powershell
  irm ${installPs1Url} | iex
  \`\`\`
- **Alternatif Standar Ekosistem (\`skills.sh\` / GitHub Repo)**:
  \`\`\`bash
  ${skillsAddCmd}
  \`\`\`
  *(Atau clone \`${repoUrl}\` untuk mengakses \`.agents/skills/\`, \`packages/cli/\`, dan \`scripts/\` secara penuh.)*

## 3. Konfigurasi Kredensial CLI (Aman — Jangan Commit ke Git!)
Simpan URL & API Key ke konfigurasi lokal terproteksi (\`~/.flashlearn/config.json\`, \`chmod 600\`):
\`\`\`bash
flashlearn config set --base-url "${origin}" --api-key "${keyValue}"
flashlearn auth whoami
\`\`\`
- **Keamanan**: Jangan pernah menaruh API Key di parameter URL atau menyimpannya ke dalam repositori Git.

## 4. Alur Kerja Mandiri Membuat Workspace Baru
Setelah terpasang, baca \`~/.agents/skills/flashlearn-curriculum-pipeline/SKILL.md\` dan jalankan siklus kanonik:
1. Cek workspace aktif: \`flashlearn workspace list\`
2. Inisialisasi kurikulum dari sumber/topik: \`flashlearn plan init ...\` (gunakan \`scripts/extract_figures.py\` bila sumber memuat diagram/ilustrasi).
3. Publikasikan modul interaktif (UILA v2), kuis + flashcard 3D, & media persisten: \`flashlearn plan push --dir "<workDir>" --upload-media\`
4. Tambahkan Misi Praktek Mandiri (\`mini_practice\` / \`capstone\`): \`flashlearn content import-project --workspace-id "<slug>" --manifest "<file.project-mission.json>"\`
5. Wajib lolos gerbang kelengkapan deterministik 100/100 sebelum selesai:
   \`flashlearn workspace audit "<slug>" --strict\`

---
**Instruksi untuk Coding Agent:**
Jalankan Langkah 2 dan Langkah 3 terlebih dahulu, konfirmasi hasil \`flashlearn auth whoami\` serta skill yang terpasang, lalu tunggu topik/sumber materi dari saya untuk dibuatkan workspace FlashLearn yang lengkap.`;
}
