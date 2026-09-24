import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, CreateWorkspaceRequest } from '@flashlearn/shared';

export class CreateWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async execute(creatorId: string, input: CreateWorkspaceRequest): Promise<Workspace> {
    const baseSlug = input.slug || this.slugify(input.name);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await this.workspaceRepository.findBySlug(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const entity = await this.workspaceRepository.create({
      name: input.name,
      slug: finalSlug,
      description: input.description,
      icon: input.icon,
      isPublic: input.isPublic !== undefined ? input.isPublic : true,
      creatorId,
    });

    return entity.toJSON();
  }
}
