import type { ProjectMissionPayload } from '../types/project-mission';

export interface ProjectMissionValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
}

export interface ProjectMissionValidationReport {
  valid: boolean;
  issues: ProjectMissionValidationIssue[];
}

function isNonEmptyString(val: unknown, minLen = 1): val is string {
  return typeof val === 'string' && val.trim().length >= minLen;
}

/**
 * Strictly validates external proof-of-work URLs to prevent XSS (javascript:, data:, vbscript:).
 * Returns normalized trimmed URL or null if empty. Throws on unsafe/malformed URLs.
 */
export function validateSafeArtifactUrl(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2048) {
    throw new Error('URL karya terlalu panjang (maksimal 2048 karakter).');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Format URL karya tidak valid. Gunakan awalan https:// atau http://.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Protokol URL '${parsed.protocol}' tidak diizinkan. Gunakan https:// atau http://.`);
  }
  return trimmed;
}

export function validateProjectMissionPayload(payload: unknown): ProjectMissionValidationReport {
  const issues: ProjectMissionValidationIssue[] = [];
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      issues: [{ severity: 'error', code: 'PAYLOAD_REQUIRED', path: '$', message: 'projectPayload must be an object' }],
    };
  }

  const p = payload as Partial<ProjectMissionPayload>;

  if (p.schemaVersion !== 'project-mission-v1') {
    issues.push({
      severity: 'error',
      code: 'INVALID_SCHEMA_VERSION',
      path: 'schemaVersion',
      message: "schemaVersion must be 'project-mission-v1'",
    });
  }

  if (p.missionLevel !== 'mini_practice' && p.missionLevel !== 'capstone') {
    issues.push({
      severity: 'error',
      code: 'INVALID_MISSION_LEVEL',
      path: 'missionLevel',
      message: "missionLevel must be 'mini_practice' or 'capstone'",
    });
  }

  if (!isNonEmptyString(p.domainCategory, 2)) {
    issues.push({
      severity: 'error',
      code: 'MISSING_DOMAIN_CATEGORY',
      path: 'domainCategory',
      message: 'domainCategory must be a non-empty string',
    });
  }

  if (typeof p.estimatedMinutes !== 'number' || p.estimatedMinutes < 5 || p.estimatedMinutes > 1200) {
    issues.push({
      severity: 'error',
      code: 'INVALID_ESTIMATED_MINUTES',
      path: 'estimatedMinutes',
      message: 'estimatedMinutes must be a number between 5 and 1200',
    });
  }

  if (!isNonEmptyString(p.realWorldBrief, 20)) {
    issues.push({
      severity: 'error',
      code: 'BRIEF_TOO_SHORT',
      path: 'realWorldBrief',
      message: 'realWorldBrief must be at least 20 characters describing a real-world scenario',
    });
  }

  if (!isNonEmptyString(p.authenticDeliverable, 10)) {
    issues.push({
      severity: 'error',
      code: 'DELIVERABLE_REQUIRED',
      path: 'authenticDeliverable',
      message: 'authenticDeliverable must clearly state the tangible artifact to build (>= 10 chars)',
    });
  }

  if (!Array.isArray(p.constraints) || p.constraints.filter((c) => isNonEmptyString(c, 3)).length === 0) {
    issues.push({
      severity: 'error',
      code: 'CONSTRAINTS_REQUIRED',
      path: 'constraints',
      message: 'constraints must include at least 1 realistic constraint',
    });
  }

  if (!Array.isArray(p.edgeCasesToTest) || p.edgeCasesToTest.filter((e) => isNonEmptyString(e, 3)).length === 0) {
    issues.push({
      severity: 'error',
      code: 'EDGE_CASES_REQUIRED',
      path: 'edgeCasesToTest',
      message: 'edgeCasesToTest must include at least 1 concrete edge case for self-testing',
    });
  }

  if (!Array.isArray(p.selfAuditRubric) || p.selfAuditRubric.length < 2) {
    issues.push({
      severity: 'error',
      code: 'RUBRIC_MINIMUM_TWO',
      path: 'selfAuditRubric',
      message: 'selfAuditRubric must contain at least 2 objective verification criteria',
    });
  } else {
    const seenIds = new Set<string>();
    p.selfAuditRubric.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        issues.push({
          severity: 'error',
          code: 'INVALID_RUBRIC_ITEM',
          path: `selfAuditRubric[${idx}]`,
          message: 'Rubric criterion must be an object',
        });
        return;
      }
      if (!isNonEmptyString(item.id)) {
        issues.push({
          severity: 'error',
          code: 'RUBRIC_ID_MISSING',
          path: `selfAuditRubric[${idx}].id`,
          message: 'Rubric criterion requires a unique id',
        });
      } else if (seenIds.has(item.id)) {
        issues.push({
          severity: 'error',
          code: 'RUBRIC_ID_DUPLICATE',
          path: `selfAuditRubric[${idx}].id`,
          message: `Duplicate rubric id '${item.id}'`,
        });
      } else {
        seenIds.add(item.id);
      }

      if (!isNonEmptyString(item.criterion, 5)) {
        issues.push({
          severity: 'error',
          code: 'RUBRIC_CRITERION_MISSING',
          path: `selfAuditRubric[${idx}].criterion`,
          message: 'Rubric criterion text must be at least 5 characters',
        });
      }
      if (!isNonEmptyString(item.verificationMethod, 5)) {
        issues.push({
          severity: 'error',
          code: 'RUBRIC_VERIFICATION_MISSING',
          path: `selfAuditRubric[${idx}].verificationMethod`,
          message: 'verificationMethod must explain how the learner verifies this criterion',
        });
      }
    });
  }

  if (p.milestones !== undefined) {
    if (!Array.isArray(p.milestones)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MILESTONES',
        path: 'milestones',
        message: 'milestones must be an array',
      });
    } else {
      const mIds = new Set<string>();
      p.milestones.forEach((m, idx) => {
        if (!m || !isNonEmptyString(m.id) || !isNonEmptyString(m.title, 3)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_MILESTONE_ITEM',
            path: `milestones[${idx}]`,
            message: 'Each milestone must have a non-empty id and title',
          });
        } else if (mIds.has(m.id)) {
          issues.push({
            severity: 'error',
            code: 'MILESTONE_ID_DUPLICATE',
            path: `milestones[${idx}].id`,
            message: `Duplicate milestone id '${m.id}'`,
          });
        } else {
          mIds.add(m.id);
        }
      });
    }
  } else if (p.missionLevel === 'capstone') {
    issues.push({
      severity: 'warning',
      code: 'CAPSTONE_MILESTONES_RECOMMENDED',
      path: 'milestones',
      message: 'Capstone missions benefit from 2-5 high-level progress milestones',
    });
  }

  return {
    valid: issues.every((i) => i.severity !== 'error'),
    issues,
  };
}
