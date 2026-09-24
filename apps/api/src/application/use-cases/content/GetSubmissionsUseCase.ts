import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { QuizSubmissionRecord, UserRole } from '@flashlearn/shared';

export class GetSubmissionsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    currentUserId: string,
    role: UserRole
  ): Promise<QuizSubmissionRecord[]> {
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
      throw new Error('Forbidden: You can only view submissions from your own workspaces');
    }

    const rows = await this.contentRepository.listSubmissions(contentId);
    return rows.map((r) => ({
      id: r.id,
      contentId: r.contentId,
      guestName: r.guestName,
      userName: r.userName,
      userEmail: r.userEmail,
      score: r.score,
      totalQuestions: r.totalQuestions,
      percentage: r.percentage,
      answers: r.answers,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
