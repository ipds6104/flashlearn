import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UserRole } from '@flashlearn/shared';

export class RestoreWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(workspaceId: string, currentUserId: string, role: UserRole): Promise<Workspace> {
    const isSuperadmin = role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(workspaceId, true);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only restore workspaces you created');
    }

    const restored = await this.workspaceRepository.restore(workspaceId);
    if (!restored) {
      throw new Error('Failed to restore workspace');
    }

    const currentVersion = await this.workspaceRepository.getLatestVersionNumber(workspaceId);
    await this.workspaceRepository.createVersion(
      workspaceId,
      currentVersion + 1,
      'restore',
      restored.toJSON(),
      currentUserId
    );

    return restored.toJSON();
  }
}
