import {
  validateSafeArtifactUrl,
  type ProjectMissionSubmission,
  type SaveProjectSubmissionRequest,
  type UserRole,
} from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IInteractiveRepository, LearnerIdentity } from '../../../domain/ports/IInteractiveRepository';
import type { IProjectSubmissionRepository } from '../../../domain/ports/IProjectSubmissionRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';

function dedupeIds(ids: unknown, allowedSet?: Set<string>): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  for (const raw of ids) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id) continue;
    if (allowedSet && !allowedSet.has(id)) continue;
    seen.add(id);
  }
  return Array.from(seen);
}

export class SaveProjectSubmissionUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly submissionRepository: IProjectSubmissionRepository,
    private readonly interactiveRepository?: IInteractiveRepository,
    private readonly workspaceRepository?: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveProjectSubmissionRequest,
    role?: UserRole
  ): Promise<ProjectMissionSubmission> {
    if (!identity.userId && !identity.sessionKey) {
      throw new Error('Either authenticated user or sessionKey is required to save project progress');
    }

    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    if (content.type !== 'project_mission' || !content.projectPayload) {
      throw new Error('Content is not a valid project_mission module');
    }

    if (this.workspaceRepository) {
      const workspace = await this.workspaceRepository.findById(content.workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      const isOwnerOrAdmin =
        role === 'superadmin' || (!!identity.userId && workspace.creatorId === identity.userId);
      if (!workspace.isPublic && !isOwnerOrAdmin) {
        throw new Error('Forbidden: Private workspace');
      }
    }

    const payload = content.projectPayload;
    const existing = await this.submissionRepository.findByLearner(contentId, identity);

    const allowedMilestoneIds = new Set((payload.milestones || []).map((m) => m.id));
    const allowedRubricIds = new Set((payload.selfAuditRubric || []).map((r) => r.id));

    const checkedMilestoneIds =
      input.checkedMilestoneIds !== undefined
        ? dedupeIds(input.checkedMilestoneIds, allowedMilestoneIds)
        : existing?.checkedMilestoneIds || [];

    const checkedRubricIds =
      input.checkedRubricIds !== undefined
        ? dedupeIds(input.checkedRubricIds, allowedRubricIds)
        : existing?.checkedRubricIds || [];

    const artifactUrl =
      input.artifactUrl !== undefined
        ? validateSafeArtifactUrl(input.artifactUrl)
        : existing?.artifactUrl ?? null;

    const artifactNotes =
      input.artifactNotes !== undefined
        ? (input.artifactNotes?.trim() || null)
        : existing?.artifactNotes ?? null;

    const selfReflection =
      input.selfReflection !== undefined
        ? (input.selfReflection?.trim() || null)
        : existing?.selfReflection ?? null;

    if (artifactNotes && artifactNotes.length > 20000) {
      throw new Error('Ringkasan karya maksimal 20.000 karakter.');
    }
    if (selfReflection && selfReflection.length > 5000) {
      throw new Error('Refleksi pribadi maksimal 5.000 karakter.');
    }

    const requestedStatus = input.status ?? existing?.status ?? 'in_progress';
    const requiredRubricCount = payload.selfAuditRubric.length;
    const allRubricChecked = requiredRubricCount > 0 && checkedRubricIds.length >= requiredRubricCount;
    const hasProofOfWork = Boolean(artifactUrl || (artifactNotes && artifactNotes.length >= 20));

    if (requestedStatus === 'completed') {
      if (!allRubricChecked) {
        throw new Error(
          `Lengkapi seluruh ceklis rubrik audit mandiri (${checkedRubricIds.length}/${requiredRubricCount}) sebelum menandai karya selesai.`
        );
      }
      if (!hasProofOfWork) {
        throw new Error(
          'Sertakan minimal tautan karya (URL) atau ringkasan hasil karya minimal 20 karakter sebagai bukti kerja.'
        );
      }
    }

    const saved = await this.submissionRepository.upsertByLearner(contentId, identity, {
      status: requestedStatus,
      checkedMilestoneIds,
      checkedRubricIds,
      artifactUrl,
      artifactNotes,
      selfReflection,
    });

    // Mirror completion and rubric progress into learner_content_progress so Workspace & Home stay in sync
    if (this.interactiveRepository) {
      const totalSteps = Math.max(1, requiredRubricCount + 1);
      const completedCount = checkedRubricIds.length + (saved.status === 'completed' ? 1 : 0);
      const currentStepIndex = Math.min(totalSteps - 1, Math.max(0, completedCount - 1));
      const ratio = Number(Math.min(1, completedCount / totalSteps).toFixed(3));
      try {
        await this.interactiveRepository.saveProgress(contentId, identity, {
          currentStepIndex,
          totalSteps,
          currentSlideIndex: 0,
          completedStepIds: [...checkedMilestoneIds, ...checkedRubricIds],
          anchoringCompleted: saved.status === 'completed',
          diagnosticAttempts: 0,
          thetaMastery: saved.status === 'completed' ? 1 : ratio,
          isCompleted: saved.status === 'completed',
        });
      } catch {
        // Non-fatal: submission itself is already durably stored
      }
    }

    return saved;
  }
}
