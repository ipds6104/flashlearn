import { describe, expect, it } from 'bun:test';
import { buildAgentSkillPrompt } from '../src/lib/agentSkillPrompt';

describe('buildAgentSkillPrompt (Copy Agent Skill)', () => {
  it('generates complete bootstrap instructions with repo, discovery URL, installers, and real API key', () => {
    const prompt = buildAgentSkillPrompt({
      origin: 'https://learn.dvlpid.my.id/',
      apiKey: 'fl_live_test_secret_123456',
      metadata: {
        repository: {
          url: 'https://github.com/ipds6104/flashlearn',
          slug: 'ipds6104/flashlearn',
          skillsAddCommand:
            'npx skills add ipds6104/flashlearn --skill flashlearn-curriculum-pipeline --skill flashlearn-figure-extractor',
        },
        cli: {
          available: true,
          bundleUrl: 'https://learn.dvlpid.my.id/api/v1/agent/cli/flashlearn.js',
          installShUrl: 'https://learn.dvlpid.my.id/api/v1/agent/install.sh',
          installPs1Url: 'https://learn.dvlpid.my.id/api/v1/agent/install.ps1',
        },
        skills: [
          {
            name: 'flashlearn-curriculum-pipeline',
            description: 'Main pipeline',
            url: 'https://learn.dvlpid.my.id/.well-known/agent-skills/flashlearn-curriculum-pipeline/SKILL.md',
            resources: [],
          },
          {
            name: 'flashlearn-figure-extractor',
            description: 'Figure extractor',
            url: 'https://learn.dvlpid.my.id/.well-known/agent-skills/flashlearn-figure-extractor/SKILL.md',
            resources: [
              {
                path: 'scripts/extract_figures.py',
                url: 'https://learn.dvlpid.my.id/.well-known/agent-skills/flashlearn-figure-extractor/scripts/extract_figures.py',
              },
            ],
          },
        ],
      },
    });

    expect(prompt).toContain('https://learn.dvlpid.my.id/.well-known/agent-skills/index.json');
    expect(prompt).toContain('https://github.com/ipds6104/flashlearn');
    expect(prompt).toContain('curl -fsSL https://learn.dvlpid.my.id/api/v1/agent/install.sh | bash');
    expect(prompt).toContain('irm https://learn.dvlpid.my.id/api/v1/agent/install.ps1 | iex');
    expect(prompt).toContain('npx skills add ipds6104/flashlearn');
    expect(prompt).toContain('scripts/extract_figures.py');
    expect(prompt).toContain(
      'flashlearn config set --base-url "https://learn.dvlpid.my.id" --api-key "fl_live_test_secret_123456"'
    );
    expect(prompt).toContain('flashlearn workspace audit "<slug>" --strict');
    // Security invariant: key is NEVER appended to installer URLs
    expect(prompt).not.toContain('install.sh?api_key');
    expect(prompt).not.toContain('install.ps1?api_key');
  });

  it('uses safe placeholder when copied without a freshly generated API key', () => {
    const prompt = buildAgentSkillPrompt({
      origin: 'https://learn.dvlpid.my.id',
      apiKey: null,
    });
    expect(prompt).toContain('<ISI_API_KEY_FLASHLEARN_ANDA>');
    expect(prompt).toContain('https://learn.dvlpid.my.id/.well-known/agent-skills/index.json');
  });
});
