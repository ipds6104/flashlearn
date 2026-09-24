import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UserRole } from '@flashlearn/shared';

export class GetWorkspaceByIdUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(
    idOrSlug: string,
    currentUserId?: string | null,
    role?: UserRole
  ): Promise<Workspace | null> {
    const isSuperadmin = role === 'superadmin';
    let entity = await this.workspaceRepository.findById(idOrSlug);
    if (!entity) {
      entity = await this.workspaceRepository.findBySlug(idOrSlug);
    }

    if (!entity) return null;

    if (!entity.canBeAccessedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You do not have permission to view this workspace');
    }

    return entity.toJSON();
  }
}
