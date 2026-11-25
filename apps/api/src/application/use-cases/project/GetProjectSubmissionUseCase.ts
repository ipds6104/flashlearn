import type { ProjectMissionSubmission, UserRole } from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { LearnerIdentity } from '../../../domain/ports/IInteractiveRepository';
import type { IProjectSubmissionRepository } from '../../../domain/ports/IProjectSubmissionRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';

export class GetProjectSubmissionUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly submissionRepository: IProjectSubmissionRepository,
    private readonly workspaceRepository?: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    identity: LearnerIdentity,
    role?: UserRole
  ): Promise<ProjectMissionSubmission | { contentId: string; notStarted: true }> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
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

    if (!identity.userId && !identity.sessionKey) {
      return { contentId, notStarted: true };
    }

    const found = await this.submissionRepository.findByLearner(contentId, identity);
    return found || { contentId, notStarted: true };
  }
}
