import type {
  OrientationExemplarKind,
  WorkspaceOrientationPayload,
} from '../types/workspace-orientation';

export interface WorkspaceOrientationValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
}

export interface WorkspaceOrientationValidationReport {
  valid: boolean;
  issues: WorkspaceOrientationValidationIssue[];
}

const VALID_EXEMPLAR_KINDS = new Set<OrientationExemplarKind>([
  'system',
  'organization',
  'team',
  'protocol',
  'practitioner',
  'work',
]);

function hasText(val: unknown, minLen = 5): val is string {
  return typeof val === 'string' && val.trim().length >= minLen;
}

export function validateWorkspaceOrientationPayload(
  payload: unknown
): WorkspaceOrientationValidationReport {
  const issues: WorkspaceOrientationValidationIssue[] = [];
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      issues: [
        {
          severity: 'error',
          code: 'ORIENTATION_REQUIRED',
          path: '$',
          message: 'orientationPayload must be an object',
        },
      ],
    };
  }

  const p = payload as Partial<WorkspaceOrientationPayload>;

  if (p.schemaVersion !== 'workspace-orientation-v1') {
    issues.push({
      severity: 'error',
      code: 'INVALID_SCHEMA_VERSION',
      path: 'schemaVersion',
      message: "schemaVersion must be 'workspace-orientation-v1'",
    });
  }

  if (!hasText(p.headline, 15)) {
    issues.push({
      severity: 'error',
      code: 'HEADLINE_TOO_SHORT',
      path: 'headline',
      message: 'headline must be at least 15 characters',
    });
  }

  if (!Array.isArray(p.hallmarksOfExcellence) || p.hallmarksOfExcellence.length < 3) {
    issues.push({
      severity: 'error',
      code: 'HALLMARKS_MINIMUM_THREE',
      path: 'hallmarksOfExcellence',
      message: 'hallmarksOfExcellence must contain at least 3 concrete hallmarks',
    });
  } else {
    p.hallmarksOfExcellence.forEach((item, idx) => {
      if (!item || !hasText(item.trait, 4) || !hasText(item.indicator, 10)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_HALLMARK_ITEM',
          path: `hallmarksOfExcellence[${idx}]`,
          message: 'Each hallmark requires trait (>=4 chars) and indicator (>=10 chars)',
        });
      }
    });
  }

  if (!Array.isArray(p.magnumOpusExamples) || p.magnumOpusExamples.length < 2) {
    issues.push({
      severity: 'error',
      code: 'MAGNUM_OPUS_MINIMUM_TWO',
      path: 'magnumOpusExamples',
      message: 'magnumOpusExamples must contain at least 2 real-world exemplars (systems, teams, organizations, protocols, works, or practitioners)',
    });
  } else {
    p.magnumOpusExamples.forEach((item, idx) => {
      if (
        !item ||
        !hasText(item.exemplarName, 3) ||
        !VALID_EXEMPLAR_KINDS.has(item.exemplarKind as OrientationExemplarKind) ||
        !hasText(item.achievement, 10) ||
        !hasText(item.knowledgeApplied, 10)
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_MAGNUM_OPUS_ITEM',
          path: `magnumOpusExamples[${idx}]`,
          message:
            'Each magnumOpusExample requires exemplarName, valid exemplarKind, achievement (>=10 chars), and knowledgeApplied (>=10 chars)',
        });
      }
    });
  }

  if (!Array.isArray(p.achievableHere) || p.achievableHere.length < 2) {
    issues.push({
      severity: 'error',
      code: 'ACHIEVABLE_MINIMUM_TWO',
      path: 'achievableHere',
      message: 'achievableHere must list at least 2 concrete capabilities mastered in this workspace',
    });
  } else {
    p.achievableHere.forEach((item, idx) => {
      if (!item || !hasText(item.capability, 8) || !hasText(item.evidenceInWorkspace, 8)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_ACHIEVABLE_ITEM',
          path: `achievableHere[${idx}]`,
          message: 'Each achievableHere item requires capability and evidenceInWorkspace (>=8 chars)',
        });
      }
    });
  }

  if (!Array.isArray(p.honestLimits) || p.honestLimits.length < 2) {
    issues.push({
      severity: 'error',
      code: 'HONEST_LIMITS_MINIMUM_TWO',
      path: 'honestLimits',
      message: 'honestLimits must state at least 2 realistic limits beyond this workspace with concrete recommendations',
    });
  } else {
    p.honestLimits.forEach((item, idx) => {
      if (
        !item ||
        !hasText(item.limit, 8) ||
        !hasText(item.whyBeyondWorkspace, 10) ||
        !hasText(item.recommendation, 10)
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_HONEST_LIMIT_ITEM',
          path: `honestLimits[${idx}]`,
          message:
            'Each honestLimits item requires limit, whyBeyondWorkspace (>=10 chars), and recommendation (>=10 chars)',
        });
      }
    });
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}
