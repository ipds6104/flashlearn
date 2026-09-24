import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { UserRole } from '@flashlearn/shared';

export class DeleteWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(id: string, currentUserId: string, role: UserRole): Promise<boolean> {
    const isSuperadmin = role === 'superadmin';
    const existing = await this.workspaceRepository.findById(id);

    if (!existing) {
      throw new Error('Workspace not found');
    }

    if (!existing.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only delete workspaces you created');
    }

    return await this.workspaceRepository.delete(id);
  }
}
