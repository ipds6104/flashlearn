import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export class RollbackContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    currentUserId: string,
    role: UserRole,
    targetVersionNumber?: number
  ): Promise<Content> {
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
      throw new Error('Forbidden: You can only rollback contents in workspaces you created');
    }

    const latestVersion = await this.contentRepository.getLatestVersionNumber(contentId);
    let desiredVersion = targetVersionNumber;

    if (!desiredVersion) {
      desiredVersion = latestVersion > 1 ? latestVersion - 1 : 1;
    }

    const versionRecord = await this.contentRepository.getVersion(contentId, desiredVersion);
    if (!versionRecord) {
      throw new Error(`Version ${desiredVersion} does not exist for this content`);
    }

    const snapshot = versionRecord.snapshot;

    const restored = await this.contentRepository.update(contentId, {
      title: snapshot.title,
      summary: snapshot.summary,
      readingTimeMinutes: snapshot.readingTimeMinutes,
      body: snapshot.body,
      questions: snapshot.questions,
      isPublished: snapshot.isPublished !== undefined ? snapshot.isPublished : true,
    });

    if (!restored) {
      throw new Error('Failed to restore content to target version');
    }

    // Save a new version tracking this rollback event
    const newVersionNumber = latestVersion + 1;
    await this.contentRepository.createVersion(
      contentId,
      newVersionNumber,
      `rollback:v${desiredVersion}`,
      restored.toJSON(true),
      currentUserId
    );

    return restored.toJSON(true);
  }
}
