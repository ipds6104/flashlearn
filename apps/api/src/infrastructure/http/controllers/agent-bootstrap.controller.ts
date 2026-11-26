import { Elysia } from 'elysia';
import { AgentSkillCatalogService } from '../../../application/services/AgentSkillCatalogService';
import {
  buildPosixInstallScript,
  buildPowerShellInstallScript,
} from '../../../application/services/AgentInstallerScriptBuilder';

function resolveRequestOrigin(request: Request): string {
  const configured = process.env.PUBLIC_APP_URL || process.env.APP_URL;
  if (configured && /^https?:\/\//i.test(configured.trim())) {
    return configured.trim().replace(/\/+$/, '');
  }
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }
  const url = new URL(request.url);
  return url.origin;
}

export function createAgentBootstrapController(
  catalog: AgentSkillCatalogService = new AgentSkillCatalogService()
) {
  return new Elysia({ name: 'agent-bootstrap-controller' })
    .get(
      '/.well-known/agent-skills/index.json',
      ({ request, set }) => {
        set.headers['Content-Type'] = 'application/json; charset=utf-8';
        set.headers['Cache-Control'] = 'public, max-age=300';
        return catalog.buildDiscoveryIndex(resolveRequestOrigin(request));
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'RFC 8615 & agentskills.io v0.2.0 Agent Skills Discovery Index',
        },
      }
    )
    .get(
      '/.well-known/agent-skills/:skill/SKILL.md',
      ({ params, set }) => {
        const resolved = catalog.resolveSkillFile(params.skill, 'SKILL.md');
        if (!resolved) {
          set.status = 404;
          return { error: `Skill '${params.skill}' not found` };
        }
        set.headers['Content-Type'] = resolved.contentType;
        set.headers['X-Content-Sha256'] = resolved.digest;
        set.headers['Cache-Control'] = 'public, max-age=300';
        return Bun.file(resolved.filePath);
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'Download SKILL.md for a FlashLearn Agent Skill',
        },
      }
    )
    .get(
      '/.well-known/agent-skills/:skill/scripts/:filename',
      ({ params, set }) => {
        const resolved = catalog.resolveSkillFile(params.skill, `scripts/${params.filename}`);
        if (!resolved) {
          set.status = 404;
          return { error: `Script '${params.filename}' not found in skill '${params.skill}'` };
        }
        set.headers['Content-Type'] = resolved.contentType;
        set.headers['X-Content-Sha256'] = resolved.digest;
        set.headers['Cache-Control'] = 'public, max-age=300';
        return Bun.file(resolved.filePath);
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'Download companion helper script for a FlashLearn Agent Skill',
        },
      }
    )
    .get(
      '/llms.txt',
      ({ request, set }) => {
        set.headers['Content-Type'] = 'text/plain; charset=utf-8';
        set.headers['Cache-Control'] = 'public, max-age=300';
        return catalog.buildLlmsTxt(resolveRequestOrigin(request));
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'Standard llms.txt index for coding agents',
        },
      }
    )
    .get(
      '/api/v1/agent/bootstrap',
      ({ request, set }) => {
        set.headers['Cache-Control'] = 'public, max-age=300';
        return catalog.buildDiscoveryIndex(resolveRequestOrigin(request));
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'JSON bootstrap metadata for Copy Agent Skill UI and automation',
        },
      }
    )
    .get(
      '/api/v1/agent/cli/flashlearn.js',
      ({ set }) => {
        const bundle = catalog.getCliBundleInfo();
        if (!bundle.available) {
          set.status = 404;
          return {
            error: 'Portable CLI bundle not built on this server. Run `bun run --cwd packages/cli build:bundle`.',
          };
        }
        set.headers['Content-Type'] = 'application/javascript; charset=utf-8';
        set.headers['Content-Disposition'] = 'attachment; filename="flashlearn.js"';
        if (bundle.digest) set.headers['X-Content-Sha256'] = bundle.digest;
        set.headers['Cache-Control'] = 'public, max-age=300';
        return Bun.file(bundle.filePath);
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'Download portable single-file Bun FlashLearn CLI bundle',
        },
      }
    )
    .get(
      '/api/v1/agent/install.sh',
      ({ request, set }) => {
        const index = catalog.buildDiscoveryIndex(resolveRequestOrigin(request));
        set.headers['Content-Type'] = 'text/x-shellscript; charset=utf-8';
        set.headers['Cache-Control'] = 'public, max-age=300';
        return buildPosixInstallScript(index);
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'POSIX shell installer for FlashLearn Agent Skills, helper scripts, and CLI',
        },
      }
    )
    .get(
      '/api/v1/agent/install.ps1',
      ({ request, set }) => {
        const index = catalog.buildDiscoveryIndex(resolveRequestOrigin(request));
        set.headers['Content-Type'] = 'text/plain; charset=utf-8';
        set.headers['Cache-Control'] = 'public, max-age=300';
        return buildPowerShellInstallScript(index);
      },
      {
        detail: {
          tags: ['Agent Discovery'],
          summary: 'PowerShell installer for FlashLearn Agent Skills, helper scripts, and CLI',
        },
      }
    );
}

export const agentBootstrapController = createAgentBootstrapController();
