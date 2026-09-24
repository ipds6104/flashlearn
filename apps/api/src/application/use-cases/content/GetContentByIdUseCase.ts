import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export class GetContentByIdUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    userId?: string | null,
    role?: UserRole
  ): Promise<Content | null> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);

    if (!content) return null;

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) return null;

    if (!workspace.canBeAccessedBy(userId, isSuperadmin)) {
      throw new Error('Forbidden: Access denied to this content');
    }

    const isOwner = workspace.canBeModifiedBy(userId || '', isSuperadmin);

    if (!content.isPublished && !isOwner) {
      throw new Error('This content is not published yet');
    }

    return content.toJSON(isOwner);
  }
}
