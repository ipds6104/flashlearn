import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export interface ListContentsInput {
  workspaceId: string;
  userId?: string | null;
  role?: UserRole;
}

export class ListContentsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(input: ListContentsInput): Promise<Content[]> {
    const isSuperadmin = input.role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeAccessedBy(input.userId, isSuperadmin)) {
      throw new Error('Forbidden: You do not have permission to view this workspace contents');
    }

    const isOwner = workspace.canBeModifiedBy(input.userId || '', isSuperadmin);
    const contents = await this.contentRepository.listByWorkspace(
      input.workspaceId,
      !isOwner // If not owner/superadmin, only published contents
    );

    return contents.map((c) => c.toJSON(isOwner));
  }
}
