import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, UpdateContentRequest, UserRole } from '@flashlearn/shared';

export class UpdateContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    currentUserId: string,
    role: UserRole,
    input: UpdateContentRequest
  ): Promise<Content> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) {
      throw new Error('Associated workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only edit contents in workspaces you created');
    }

    const updated = await this.contentRepository.update(contentId, input);
    if (!updated) {
      throw new Error('Failed to update content');
    }

    return updated.toJSON(true);
  }
}
