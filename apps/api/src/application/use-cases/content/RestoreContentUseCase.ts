import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export class RestoreContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(contentId: string, currentUserId: string, role: UserRole): Promise<Content> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId, true);

    if (!content) {
      throw new Error('Content not found');
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId, true);
    if (!workspace) {
      throw new Error('Associated workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only restore contents in workspaces you created');
    }

    const restored = await this.contentRepository.restore(contentId);
    if (!restored) {
      throw new Error('Failed to restore content');
    }

    const currentVersion = await this.contentRepository.getLatestVersionNumber(contentId);
    await this.contentRepository.createVersion(
      contentId,
      currentVersion + 1,
      'restore',
      restored.toJSON(true),
      currentUserId
    );

    return restored.toJSON(true);
  }
}
