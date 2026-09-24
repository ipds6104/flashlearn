import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UserRole } from '@flashlearn/shared';

export class RollbackWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(
    workspaceId: string,
    currentUserId: string,
    role: UserRole,
    targetVersionNumber?: number
  ): Promise<Workspace> {
    const isSuperadmin = role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(workspaceId, true);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only rollback workspaces you created');
    }

    const latestVersion = await this.workspaceRepository.getLatestVersionNumber(workspaceId);
    let desiredVersion = targetVersionNumber;

    if (!desiredVersion) {
      desiredVersion = latestVersion > 1 ? latestVersion - 1 : 1;
    }

    const versionRecord = await this.workspaceRepository.getVersion(workspaceId, desiredVersion);
    if (!versionRecord) {
      throw new Error(`Version ${desiredVersion} does not exist for this workspace`);
    }

    const snapshot = versionRecord.snapshot;

    const restored = await this.workspaceRepository.update(workspaceId, {
      name: snapshot.name,
      description: snapshot.description,
      coverImage: snapshot.coverImage,
      icon: snapshot.icon,
      isPublic: snapshot.isPublic !== undefined ? snapshot.isPublic : true,
    });

    if (!restored) {
      throw new Error('Failed to restore workspace to target version');
    }

    const newVersionNumber = latestVersion + 1;
    await this.workspaceRepository.createVersion(
      workspaceId,
      newVersionNumber,
      `rollback:v${desiredVersion}`,
      restored.toJSON(),
      currentUserId
    );

    return restored.toJSON();
  }
}
