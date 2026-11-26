import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import {
  validateWorkspaceOrientationPayload,
  type Workspace,
  type UpdateWorkspaceRequest,
  type UserRole,
} from '@flashlearn/shared';

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

    if (input.orientationPayload !== undefined && input.orientationPayload !== null) {
      const report = validateWorkspaceOrientationPayload(input.orientationPayload);
      if (!report.valid) {
        const firstErr = report.issues.find((i) => i.severity === 'error');
        throw new Error(
          `Invalid orientationPayload (${firstErr?.code || 'INVALID'} at ${firstErr?.path || '$'}): ${firstErr?.message || 'Validation failed'}`
        );
      }
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
