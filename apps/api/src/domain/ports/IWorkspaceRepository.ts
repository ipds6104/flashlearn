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
  findById(id: string, includeDeleted?: boolean): Promise<WorkspaceEntity | null>;
  findBySlug(slug: string): Promise<WorkspaceEntity | null>;
  listPublic(includeDeleted?: boolean): Promise<WorkspaceEntity[]>;
  listByCreator(creatorId: string, includeDeleted?: boolean): Promise<WorkspaceEntity[]>;
  listAll(includeDeleted?: boolean): Promise<WorkspaceEntity[]>;
  create(data: CreateWorkspaceData): Promise<WorkspaceEntity>;
  update(id: string, data: UpdateWorkspaceData): Promise<WorkspaceEntity | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<WorkspaceEntity | null>;
  createVersion(workspaceId: string, versionNumber: number, action: string, snapshot: any, changedBy?: string | null): Promise<void>;
  getLatestVersionNumber(workspaceId: string): Promise<number>;
  getVersion(workspaceId: string, versionNumber: number): Promise<any | null>;
  listVersions(workspaceId: string): Promise<any[]>;
}
