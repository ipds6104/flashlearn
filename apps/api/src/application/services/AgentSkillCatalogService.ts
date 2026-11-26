import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export interface AgentSkillResourceEntry {
  path: string;
  url: string;
  digest: string;
  bytes: number;
}

export interface AgentSkillDiscoveryEntry {
  name: string;
  type: 'skill-md';
  description: string;
  url: string;
  digest: string;
  role: 'primary' | 'companion' | 'internal';
  resources: AgentSkillResourceEntry[];
}

export interface AgentSkillDiscoveryIndex {
  $schema: string;
  schemaVersion: '0.2.0';
  generatedAt: string;
  platform: {
    name: string;
    origin: string;
    apiBaseUrl: string;
    docsUrl: string;
    llmsTxtUrl: string;
  };
  repository: {
    url: string;
    slug: string;
    skillsAddCommand: string;
  };
  cli: {
    name: string;
    available: boolean;
    bundleUrl: string;
    digest: string | null;
    bytes: number;
    installShUrl: string;
    installPs1Url: string;
  };
  skills: AgentSkillDiscoveryEntry[];
}

const DEFAULT_PUBLIC_REPO = 'https://github.com/ipds6104/flashlearn';
const VALID_SKILL_NAME = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const VALID_SCRIPT_FILE = /^[a-zA-Z0-9._-]{1,120}$/;

function sha256Buffer(buf: Buffer): string {
  return `sha256:${createHash('sha256').update(buf).digest('hex')}`;
}

function parseFrontmatter(markdown: string): { name?: string; description?: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: { name?: string; description?: string } = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const idx = rawLine.indexOf(':');
    if (idx <= 0) continue;
    const key = rawLine.slice(0, idx).trim();
    const val = rawLine
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key === 'name') result.name = val;
    if (key === 'description') result.description = val;
  }
  return result;
}

function resolveRepoInfo(rawRepoUrl?: string): { url: string; slug: string } {
  const url = (rawRepoUrl || process.env.FLASHLEARN_PUBLIC_REPO || DEFAULT_PUBLIC_REPO)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  const ghMatch = url.match(/github\.com\/([^/]+\/[^/]+)$/i);
  return {
    url,
    slug: ghMatch ? ghMatch[1] : 'ipds6104/flashlearn',
  };
}

function classifySkillRole(name: string): 'primary' | 'companion' | 'internal' {
  if (name === 'flashlearn-curriculum-pipeline') return 'primary';
  if (name === 'flashlearn-figure-extractor') return 'companion';
  return 'internal';
}

export class AgentSkillCatalogService {
  private readonly repoRoot: string;
  private readonly skillsDir: string;
  private readonly cliBundlePath: string;
  private readonly repoUrlOverride?: string;

  constructor(opts: { repoRoot?: string; repoUrl?: string } = {}) {
    this.repoRoot = resolve(opts.repoRoot || join(import.meta.dir, '../../../../..'));
    this.skillsDir = resolve(this.repoRoot, '.agents', 'skills');
    this.cliBundlePath = resolve(this.repoRoot, 'packages', 'cli', 'dist', 'flashlearn.js');
    this.repoUrlOverride = opts.repoUrl;
  }

  getRepositoryInfo(): { url: string; slug: string } {
    return resolveRepoInfo(this.repoUrlOverride);
  }

  listSkills(origin: string): AgentSkillDiscoveryEntry[] {
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (!existsSync(this.skillsDir)) return [];

    const dirs = readdirSync(this.skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && VALID_SKILL_NAME.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => {
        const order = { primary: 0, companion: 1, internal: 2 };
        const diff = order[classifySkillRole(a)] - order[classifySkillRole(b)];
        return diff !== 0 ? diff : a.localeCompare(b);
      });

    const skills: AgentSkillDiscoveryEntry[] = [];
    for (const dirName of dirs) {
      const skillMdPath = resolve(this.skillsDir, dirName, 'SKILL.md');
      if (!existsSync(skillMdPath) || !statSync(skillMdPath).isFile()) continue;

      const rawBytes = readFileSync(skillMdPath);
      const fm = parseFrontmatter(rawBytes.toString('utf-8'));
      const name = fm.name && VALID_SKILL_NAME.test(fm.name) ? fm.name : dirName;
      const description =
        (fm.description || `FlashLearn agent skill: ${name}`).slice(0, 1024);

      const resources: AgentSkillResourceEntry[] = [];
      const scriptsDir = resolve(this.skillsDir, dirName, 'scripts');
      if (existsSync(scriptsDir) && statSync(scriptsDir).isDirectory()) {
        for (const file of readdirSync(scriptsDir).sort()) {
          if (!VALID_SCRIPT_FILE.test(file)) continue;
          const filePath = resolve(scriptsDir, file);
          if (!statSync(filePath).isFile()) continue;
          const scriptBytes = readFileSync(filePath);
          resources.push({
            path: `scripts/${file}`,
            url: `${cleanOrigin}/.well-known/agent-skills/${dirName}/scripts/${file}`,
            digest: sha256Buffer(scriptBytes),
            bytes: scriptBytes.byteLength,
          });
        }
      }

      skills.push({
        name,
        type: 'skill-md',
        description,
        url: `${cleanOrigin}/.well-known/agent-skills/${dirName}/SKILL.md`,
        digest: sha256Buffer(rawBytes),
        role: classifySkillRole(dirName),
        resources,
      });
    }

    return skills;
  }

  getCliBundleInfo(): { available: boolean; filePath: string; digest: string | null; bytes: number } {
    if (!existsSync(this.cliBundlePath) || !statSync(this.cliBundlePath).isFile()) {
      return { available: false, filePath: this.cliBundlePath, digest: null, bytes: 0 };
    }
    const buf = readFileSync(this.cliBundlePath);
    return {
      available: true,
      filePath: this.cliBundlePath,
      digest: sha256Buffer(buf),
      bytes: buf.byteLength,
    };
  }

  resolveSkillFile(
    skillName: string,
    relativePath: string
  ): { filePath: string; contentType: string; digest: string } | null {
    if (!VALID_SKILL_NAME.test(skillName)) return null;
    if (relativePath !== 'SKILL.md') {
      const m = relativePath.match(/^scripts\/([a-zA-Z0-9._-]{1,120})$/);
      if (!m || m[1].includes('..')) return null;
    }

    const skillRoot = resolve(this.skillsDir, skillName);
    if (!skillRoot.startsWith(this.skillsDir + sep)) return null;

    const target = resolve(skillRoot, relativePath);
    if (!target.startsWith(skillRoot + sep)) return null;
    if (!existsSync(target) || !statSync(target).isFile()) return null;

    const contentType = relativePath.endsWith('.md')
      ? 'text/markdown; charset=utf-8'
      : relativePath.endsWith('.py')
      ? 'text/x-python; charset=utf-8'
      : 'text/plain; charset=utf-8';

    return {
      filePath: target,
      contentType,
      digest: sha256Buffer(readFileSync(target)),
    };
  }

  buildDiscoveryIndex(origin: string): AgentSkillDiscoveryIndex {
    const cleanOrigin = origin.replace(/\/+$/, '');
    const repo = this.getRepositoryInfo();
    const cli = this.getCliBundleInfo();
    const skills = this.listSkills(cleanOrigin);
    const primaryNames = skills
      .filter((s) => s.role === 'primary' || s.role === 'companion')
      .map((s) => `--skill ${s.name}`)
      .join(' ');

    return {
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      schemaVersion: '0.2.0',
      generatedAt: new Date().toISOString(),
      platform: {
        name: 'FlashLearn',
        origin: cleanOrigin,
        apiBaseUrl: `${cleanOrigin}/api/v1`,
        docsUrl: `${cleanOrigin}/docs`,
        llmsTxtUrl: `${cleanOrigin}/llms.txt`,
      },
      repository: {
        url: repo.url,
        slug: repo.slug,
        skillsAddCommand: `npx skills add ${repo.slug} ${primaryNames || '--skill flashlearn-curriculum-pipeline'}`.trim(),
      },
      cli: {
        name: 'flashlearn',
        available: cli.available,
        bundleUrl: `${cleanOrigin}/api/v1/agent/cli/flashlearn.js`,
        digest: cli.digest,
        bytes: cli.bytes,
        installShUrl: `${cleanOrigin}/api/v1/agent/install.sh`,
        installPs1Url: `${cleanOrigin}/api/v1/agent/install.ps1`,
      },
      skills,
    };
  }

  buildLlmsTxt(origin: string): string {
    const idx = this.buildDiscoveryIndex(origin);
    const skillLines = idx.skills
      .map((s) => {
        const scriptNote =
          s.resources.length > 0
            ? ` (includes ${s.resources.map((r) => r.path).join(', ')})`
            : '';
        return `- [${s.name}](${s.url}): ${s.description}${scriptNote}`;
      })
      .join('\n');

    return [
      '# FlashLearn — Autonomous Learning & Curriculum Engine',
      '',
      '> FlashLearn enables coding agents to build, verify, and publish interactive workspaces (UILA v2 interactive modules, scalable 10–600+ question quiz/flashcard drills, authentic project missions, and persistent visual figures).',
      '',
      '## Agent Skill Discovery (agentskills.io v0.2.0)',
      `- [Agent Skills Index (JSON + SHA-256)](${idx.platform.origin}/.well-known/agent-skills/index.json)`,
      `- [OpenAPI / Scalar Docs](${idx.platform.docsUrl})`,
      `- [Source Repository](${idx.repository.url})`,
      '',
      '## Self-Bootstrap Installers (Skills + Helper Scripts + CLI)',
      `- Linux/macOS/Termux: \`curl -fsSL ${idx.cli.installShUrl} | bash\``,
      `- Windows PowerShell: \`irm ${idx.cli.installPs1Url} | iex\``,
      `- Ecosystem CLI: \`${idx.repository.skillsAddCommand}\``,
      '',
      '## Available Skills',
      skillLines || '- No skills bundled on server',
      '',
      '## Security Note',
      '- Never pass API keys in URL query strings or commit keys into git repositories.',
      '- Configure credentials locally via `flashlearn config set --base-url ' +
        idx.platform.origin +
        ' --api-key "$FLASHLEARN_API_KEY"` (stored chmod 0600 in `~/.flashlearn/config.json`).',
      '',
    ].join('\n');
  }
}
