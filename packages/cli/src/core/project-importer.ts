import { readFileSync } from 'node:fs';
import type { ApiClient } from './client';
import { CliError, ExitCode, type NextAction } from './envelope';
import { slugifyText } from './corpus/xml-utils';
import { pushProjectMissionModule } from './plan/project-mission-pusher';

export interface StandaloneProjectImportFlags {
  workspaceRef: string;
  manifestPath: string;
  title?: string;
  slug?: string;
  summary?: string;
  domainId?: string;
  readingTime?: number;
  dryRun?: boolean;
}

export async function importStandaloneProjectMission(
  client: ApiClient,
  opts: StandaloneProjectImportFlags
): Promise<{ data: any; nextActions: NextAction[] }> {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(readFileSync(opts.manifestPath, 'utf-8'));
  } catch (err: any) {
    throw new CliError({
      code: 'INVALID_FILE',
      message: `Failed to read project mission manifest JSON from ${opts.manifestPath}: ${err.message}`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }

  let workspaceId = opts.workspaceRef;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opts.workspaceRef);
  if (!opts.dryRun && !isUuid) {
    const list = await client
      .request<any[]>('/api/v1/workspaces', { query: { scope: 'all' } })
      .catch(() => client.request<any[]>('/api/v1/workspaces'));
    const found = (Array.isArray(list) ? list : []).find((w) => w.slug === opts.workspaceRef);
    if (!found?.id) {
      throw new CliError({
        code: 'WORKSPACE_NOT_FOUND',
        message: `Workspace '${opts.workspaceRef}' not found.`,
        exitCode: ExitCode.GENERAL_ERROR,
      });
    }
    workspaceId = found.id;
  }

  const title = opts.title || parsed.title || 'Misi Praktek Mandiri';
  const slug = opts.slug || parsed.slug || slugifyText(title);

  const data = await pushProjectMissionModule(client, {
    workspaceId,
    domainId: opts.domainId,
    mod: {
      slug,
      title,
      unitCode: parsed.unitMeta?.unitCode || 'CAPSTONE',
      moduleOrder: parsed.unitMeta?.moduleOrder ?? 999,
      contentType: 'project_mission',
      knowledgeProfile: 'procedural_do',
      estimatedMinutes: Number(opts.readingTime || parsed.estimatedMinutes || 60),
      needsSlideDeck: false,
      sourceSliceIds: [],
      prerequisites: [],
      state: 'audited',
      notes: opts.summary || parsed.summary,
    },
    parsed: {
      ...parsed,
      title,
      ...(opts.summary ? { summary: opts.summary } : {}),
    },
    dryRun: Boolean(opts.dryRun),
  });

  return {
    data,
    nextActions: [
      {
        command: `flashlearn workspace audit ${opts.workspaceRef} --strict`,
        description: 'Verify workspace completeness score after importing project mission',
      },
    ],
  };
}
