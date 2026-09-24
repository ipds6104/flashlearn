import type { WorkspaceEntity } from '../entities/Workspace';

export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  isPublic: boolean;
  creatorId: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  isPublic?: boolean;
}

export interface IWorkspaceRepository {
  findById(id: string): Promise<WorkspaceEntity | null>;
  findBySlug(slug: string): Promise<WorkspaceEntity | null>;
  listPublic(): Promise<WorkspaceEntity[]>;
  listByCreator(creatorId: string): Promise<WorkspaceEntity[]>;
  listAll(): Promise<WorkspaceEntity[]>;
  create(data: CreateWorkspaceData): Promise<WorkspaceEntity>;
  update(id: string, data: UpdateWorkspaceData): Promise<WorkspaceEntity | null>;
  delete(id: string): Promise<boolean>;
}
