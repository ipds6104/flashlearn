import {
  validateProjectMissionPayload,
  type PlanModuleEntry,
  type ProjectMissionPayload,
} from '@flashlearn/shared';
import type { ApiClient } from '../client';

export interface ProjectMissionPushOptions {
  workspaceId: string;
  domainId?: string;
  mod: PlanModuleEntry;
  parsed: Record<string, any>;
  dryRun: boolean;
}

export interface ProjectMissionDryRunResult {
  slug: string;
  unitCode: string;
  dryRun: true;
  contentType: 'project_mission';
  missionLevel: 'mini_practice' | 'capstone';
  rubricCount: number;
  warnings: string[];
}

export interface ProjectMissionLiveResult {
  contentId: string;
  action: 'created' | 'updated';
  contentType: 'project_mission';
  missionLevel: 'mini_practice' | 'capstone';
  rubricCount: number;
}

export function isProjectMissionModule(mod: PlanModuleEntry, parsed: unknown): boolean {
  if (mod.contentType === 'project_mission') return true;
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  return obj.schemaVersion === 'project-mission-v1';
}

export async function pushProjectMissionModule(
  client: ApiClient,
  opts: ProjectMissionPushOptions
): Promise<ProjectMissionDryRunResult | ProjectMissionLiveResult> {
  const { workspaceId, domainId, mod, parsed, dryRun } = opts;
  const report = validateProjectMissionPayload(parsed);
  const errors = report.issues.filter((i) => i.severity === 'error');
  if (!report.valid) {
    const details = errors.map((e) => `${e.code}: ${e.message}`).join('; ');
    throw new Error(`Invalid project_mission manifest '${mod.slug}': ${details}`);
  }

  const payload = parsed as ProjectMissionPayload;
  const warnings = report.issues.filter((i) => i.severity === 'warning').map((w) => w.message);

  if (dryRun) {
    return {
      slug: mod.slug,
      unitCode: mod.unitCode,
      dryRun: true,
      contentType: 'project_mission',
      missionLevel: payload.missionLevel,
      rubricCount: payload.selfAuditRubric.length,
      warnings,
    };
  }

  const remoteList = await client
    .request<any[]>(`/api/v1/contents/workspace/${workspaceId}`)
    .catch(() => []);
  const activeRemote = (Array.isArray(remoteList) ? remoteList : []).filter(
    (c) => !c.deletedAt && c.status !== 'deleted'
  );
  const existing = activeRemote.find((c) => c.slug === mod.slug);

  const sharedFields = {
    type: 'project_mission' as const,
    domainId,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : mod.title,
    slug: mod.slug,
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary
        : mod.notes || payload.authenticDeliverable,
    readingTimeMinutes: payload.estimatedMinutes || mod.estimatedMinutes,
    projectPayload: payload,
    isPublished: true,
  };

  if (existing?.id) {
    const updated = await client.request<any>(`/api/v1/contents/${existing.id}`, {
      method: 'PUT',
      body: sharedFields,
    });
    return {
      contentId: updated?.id || existing.id,
      action: 'updated',
      contentType: 'project_mission',
      missionLevel: payload.missionLevel,
      rubricCount: payload.selfAuditRubric.length,
    };
  }

  const created = await client.request<any>('/api/v1/contents', {
    method: 'POST',
    body: {
      workspaceId,
      ...sharedFields,
    },
  });

  return {
    contentId: created?.id || '',
    action: 'created',
    contentType: 'project_mission',
    missionLevel: payload.missionLevel,
    rubricCount: payload.selfAuditRubric.length,
  };
}
