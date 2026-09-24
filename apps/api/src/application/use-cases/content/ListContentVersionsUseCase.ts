import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { ContentVersion, UserRole } from '@flashlearn/shared';

export class ListContentVersionsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(contentId: string, currentUserId: string, role: UserRole): Promise<ContentVersion[]> {
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
      throw new Error('Forbidden: You can only view versions of contents in your own workspaces');
    }

    const rows = await this.contentRepository.listVersions(contentId);
    return rows.map((r) => ({
      id: r.id,
      contentId: r.contentId,
      versionNumber: r.versionNumber,
      action: r.action,
      snapshot: r.snapshot,
      changedBy: r.changedBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
