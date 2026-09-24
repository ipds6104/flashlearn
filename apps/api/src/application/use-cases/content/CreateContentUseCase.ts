import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Content, CreateContentRequest, UserRole } from '@flashlearn/shared';

export class CreateContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async execute(
    currentUserId: string,
    role: UserRole,
    input: CreateContentRequest
  ): Promise<Content> {
    const isSuperadmin = role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only add content to workspaces you created');
    }

    const baseSlug = input.slug || this.slugify(input.title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await this.contentRepository.findBySlug(input.workspaceId, finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const entity = await this.contentRepository.create({
      workspaceId: input.workspaceId,
      title: input.title,
      slug: finalSlug,
      type: input.type,
      summary: input.summary,
      readingTimeMinutes: input.readingTimeMinutes || 5,
      body: input.body,
      questions: input.questions,
      isPublished: input.isPublished !== undefined ? input.isPublished : true,
    });

    await this.contentRepository.createVersion(
      entity.id,
      1,
      'create',
      entity.toJSON(true),
      currentUserId
    );

    return entity.toJSON();
  }
}
