import { describe, expect, it } from 'bun:test';
import { join, resolve } from 'node:path';
import { AgentSkillCatalogService } from '../src/application/services/AgentSkillCatalogService';
import { createAgentBootstrapController } from '../src/infrastructure/http/controllers/agent-bootstrap.controller';

const REPO_ROOT = resolve(import.meta.dir, '../../..');

describe('Phase 27: Agent Skill Discovery & Self-Bootstrap Endpoints', () => {
  const catalog = new AgentSkillCatalogService({
    repoRoot: REPO_ROOT,
    repoUrl: 'https://github.com/ipds6104/flashlearn',
  });
  const app = createAgentBootstrapController(catalog);

  it('serves RFC 8615 /.well-known/agent-skills/index.json conforming to agentskills.io v0.2.0', async () => {
    const res = await app.handle(
      new Request('https://learn.example.test/.well-known/agent-skills/index.json')
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;

    expect(body.$schema).toBe('https://schemas.agentskills.io/discovery/0.2.0/schema.json');
    expect(body.schemaVersion).toBe('0.2.0');
    expect(body.platform.origin).toBe('https://learn.example.test');
    expect(body.repository.url).toBe('https://github.com/ipds6104/flashlearn');
    expect(body.repository.skillsAddCommand).toContain('npx skills add ipds6104/flashlearn');
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills.length).toBeGreaterThanOrEqual(2);

    const pipeline = body.skills.find((s: any) => s.name === 'flashlearn-curriculum-pipeline');
    expect(pipeline).toBeDefined();
    expect(pipeline.type).toBe('skill-md');
    expect(pipeline.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(pipeline.url).toBe(
      'https://learn.example.test/.well-known/agent-skills/flashlearn-curriculum-pipeline/SKILL.md'
    );

    const figSkill = body.skills.find((s: any) => s.name === 'flashlearn-figure-extractor');
    expect(figSkill).toBeDefined();
    expect(figSkill.resources.some((r: any) => r.path === 'scripts/extract_figures.py')).toBe(true);
  });

  it('serves SKILL.md and companion scripts with SHA-256 header and rejects path traversal', async () => {
    const skillRes = await app.handle(
      new Request(
        'https://learn.example.test/.well-known/agent-skills/flashlearn-curriculum-pipeline/SKILL.md'
      )
    );
    expect(skillRes.status).toBe(200);
    expect(skillRes.headers.get('x-content-sha256')).toMatch(/^sha256:[0-9a-f]{64}$/);
    const mdText = await skillRes.text();
    expect(mdText).toContain('flashlearn-curriculum-pipeline');

    const scriptRes = await app.handle(
      new Request(
        'https://learn.example.test/.well-known/agent-skills/flashlearn-figure-extractor/scripts/extract_figures.py'
      )
    );
    expect(scriptRes.status).toBe(200);
    expect(scriptRes.headers.get('x-content-sha256')).toMatch(/^sha256:[0-9a-f]{64}$/);

    // Strict path traversal protection
    const traversal1 = catalog.resolveSkillFile('../apps', 'SKILL.md');
    const traversal2 = catalog.resolveSkillFile(
      'flashlearn-figure-extractor',
      'scripts/../../package.json'
    );
    const traversal3 = catalog.resolveSkillFile(
      'flashlearn-curriculum-pipeline',
      'package.json'
    );
    expect(traversal1).toBeNull();
    expect(traversal2).toBeNull();
    expect(traversal3).toBeNull();
  });

  it('serves /llms.txt and cross-OS installers without embedding any API keys in URLs', async () => {
    const llmsRes = await app.handle(new Request('https://learn.example.test/llms.txt'));
    expect(llmsRes.status).toBe(200);
    const llms = await llmsRes.text();
    expect(llms).toContain('/.well-known/agent-skills/index.json');
    expect(llms).toContain('/api/v1/agent/install.sh');

    const shRes = await app.handle(
      new Request('https://learn.example.test/api/v1/agent/install.sh?api_key=fl_live_leaked')
    );
    expect(shRes.status).toBe(200);
    const sh = await shRes.text();
    expect(sh).toContain('verify_sha256');
    expect(sh).toContain('flashlearn-curriculum-pipeline/SKILL.md');
    expect(sh).toContain('scripts/extract_figures.py');
    expect(sh).toContain('FLASHLEARN_API_KEY');
    expect(sh).not.toContain('fl_live_leaked');

    const psRes = await app.handle(
      new Request('https://learn.example.test/api/v1/agent/install.ps1')
    );
    expect(psRes.status).toBe(200);
    const ps = await psRes.text();
    expect(ps).toContain('Get-FileHash -Path $Dest -Algorithm SHA256');
    expect(ps).toContain('$env:FLASHLEARN_API_KEY');
  });

  it('exposes /api/v1/agent/cli/flashlearn.js when bundle exists on disk', async () => {
    const cliInfo = catalog.getCliBundleInfo();
    expect(cliInfo.filePath).toBe(join(REPO_ROOT, 'packages', 'cli', 'dist', 'flashlearn.js'));
    if (cliInfo.available) {
      const res = await app.handle(
        new Request('https://learn.example.test/api/v1/agent/cli/flashlearn.js')
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('x-content-sha256')).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });
});
