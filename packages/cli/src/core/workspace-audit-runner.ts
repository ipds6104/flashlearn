import {
  auditWorkspaceCompleteness,
  type Content,
  type Domain,
  type Workspace,
} from '@flashlearn/shared';
import type { ApiClient } from './client';
import { CliError, ExitCode, type NextAction } from './envelope';

export async function runWorkspaceAuditCommand(
  client: ApiClient,
  idOrSlug: string,
  strict: boolean
): Promise<{ data: ReturnType<typeof auditWorkspaceCompleteness>; nextActions: NextAction[] }> {
  let ws: Workspace | undefined;
  try {
    ws = await client.request<Workspace>(`/api/v1/workspaces/${idOrSlug}`);
  } catch {
    const list = await client
      .request<Workspace[]>('/api/v1/workspaces', { query: { scope: 'all' } })
      .catch(() => client.request<Workspace[]>('/api/v1/workspaces'));
    ws = (Array.isArray(list) ? list : []).find(
      (w) => w.slug === idOrSlug || w.id === idOrSlug
    );
  }

  if (!ws?.id) {
    throw new CliError({
      code: 'WORKSPACE_NOT_FOUND',
      message: `Workspace '${idOrSlug}' not found.`,
      exitCode: ExitCode.GENERAL_ERROR,
    });
  }

  const [contents, domRes] = await Promise.all([
    client.request<Content[]>(`/api/v1/contents/workspace/${ws.id}`).catch(() => []),
    client
      .request<{ domains?: Domain[] }>(`/api/v1/domains/workspace/${ws.id}`)
      .catch(() => ({ domains: [] })),
  ]);

  const report = auditWorkspaceCompleteness({
    workspace: ws,
    contents: Array.isArray(contents) ? contents : [],
    domains: domRes?.domains || [],
  });

  const nextActions: NextAction[] = [];
  for (const gap of report.gaps.slice(0, 4)) {
    if (gap.suggestedCommand) {
      nextActions.push({
        command: gap.suggestedCommand,
        description: `[${gap.severity.toUpperCase()} · skill: ${gap.recommendedSkill}] ${gap.message}`,
      });
    }
  }
  if (report.status !== 'COMPLETE') {
    nextActions.push({
      command: `flashlearn workspace audit ${ws.slug || ws.id} --strict`,
      description: 'Re-run deterministic audit after remediating gaps with flashlearn-curriculum-pipeline skill',
    });
  }

  if (strict && report.status !== 'COMPLETE') {
    throw new CliError({
      code: 'WORKSPACE_AUDIT_FAILED',
      message: `${report.skillDirective} (Score: ${report.score}/100, Status: ${report.status})`,
      exitCode: ExitCode.VALIDATION_ERROR,
      suggestedFix:
        report.gaps[0]?.suggestedCommand ||
        "Use skill 'flashlearn-curriculum-pipeline' to remediate gaps.",
    });
  }

  return { data: report, nextActions };
}
