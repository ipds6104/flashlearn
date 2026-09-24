import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UpdateWorkspaceRequest, UserRole } from '@flashlearn/shared';

export class UpdateWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(
    id: string,
    currentUserId: string,
    role: UserRole,
    input: UpdateWorkspaceRequest
  ): Promise<Workspace> {
    const isSuperadmin = role === 'superadmin';
    const existing = await this.workspaceRepository.findById(id);

    if (!existing) {
      throw new Error('Workspace not found');
    }

    if (!existing.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only edit workspaces you created');
    }

    const updated = await this.workspaceRepository.update(id, input);
    if (!updated) {
      throw new Error('Failed to update workspace');
    }

    const currentVersion = await this.workspaceRepository.getLatestVersionNumber(id);
    await this.workspaceRepository.createVersion(
      id,
      currentVersion + 1,
      'update',
      updated.toJSON(),
      currentUserId
    );

    return updated.toJSON();
  }
}
