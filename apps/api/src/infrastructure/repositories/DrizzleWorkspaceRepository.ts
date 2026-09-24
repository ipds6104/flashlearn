import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from '../database/db';
import { workspaces, users, workspaceVersions } from '../database/schema';
import { WorkspaceEntity } from '../../domain/entities/Workspace';
import type {
  IWorkspaceRepository,
  CreateWorkspaceData,
  UpdateWorkspaceData,
} from '../../domain/ports/IWorkspaceRepository';

export class DrizzleWorkspaceRepository implements IWorkspaceRepository {
  private mapToEntity(row: any): WorkspaceEntity {
    return new WorkspaceEntity({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      coverImage: row.coverImage,
      icon: row.icon,
      isPublic: row.isPublic,
      creatorId: row.creatorId,
      creatorName: row.creatorName,
      creatorEmail: row.creatorEmail,
      contentCount: row.contentCount !== undefined ? Number(row.contentCount) : 0,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string, includeDeleted = false): Promise<WorkspaceEntity | null> {
    const conditions = [eq(workspaces.id, id)];
    if (!includeDeleted) {
      conditions.push(isNull(workspaces.deletedAt));
    }

    const [row] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        coverImage: workspaces.coverImage,
        icon: workspaces.icon,
        isPublic: workspaces.isPublic,
        creatorId: workspaces.creatorId,
        deletedAt: workspaces.deletedAt,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(and(...conditions));

    return row ? this.mapToEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<WorkspaceEntity | null> {
    const [row] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        coverImage: workspaces.coverImage,
        icon: workspaces.icon,
        isPublic: workspaces.isPublic,
        creatorId: workspaces.creatorId,
        deletedAt: workspaces.deletedAt,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(and(eq(workspaces.slug, slug), isNull(workspaces.deletedAt)));

    return row ? this.mapToEntity(row) : null;
  }

  async listPublic(includeDeleted = false): Promise<WorkspaceEntity[]> {
    const conditions = [eq(workspaces.isPublic, true)];
    if (!includeDeleted) {
      conditions.push(isNull(workspaces.deletedAt));
    }

    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        coverImage: workspaces.coverImage,
        icon: workspaces.icon,
        isPublic: workspaces.isPublic,
        creatorId: workspaces.creatorId,
        deletedAt: workspaces.deletedAt,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(workspaces.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listByCreator(creatorId: string, includeDeleted = false): Promise<WorkspaceEntity[]> {
    const conditions = [eq(workspaces.creatorId, creatorId)];
    if (!includeDeleted) {
      conditions.push(isNull(workspaces.deletedAt));
    }

    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        coverImage: workspaces.coverImage,
        icon: workspaces.icon,
        isPublic: workspaces.isPublic,
        creatorId: workspaces.creatorId,
        deletedAt: workspaces.deletedAt,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(workspaces.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listAll(includeDeleted = false): Promise<WorkspaceEntity[]> {
    const conditions = [];
    if (!includeDeleted) {
      conditions.push(isNull(workspaces.deletedAt));
    }

    const query = db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        coverImage: workspaces.coverImage,
        icon: workspaces.icon,
        isPublic: workspaces.isPublic,
        creatorId: workspaces.creatorId,
        deletedAt: workspaces.deletedAt,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id));

    const rows = conditions.length > 0 ? await query.where(and(...conditions)).orderBy(desc(workspaces.createdAt)) : await query.orderBy(desc(workspaces.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateWorkspaceData): Promise<WorkspaceEntity> {
    const [row] = await db
      .insert(workspaces)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        coverImage: data.coverImage,
        icon: data.icon,
        isPublic: data.isPublic,
        creatorId: data.creatorId,
      })
      .returning();

    return (await this.findById(row.id)) as WorkspaceEntity;
  }

  async update(id: string, data: UpdateWorkspaceData): Promise<WorkspaceEntity | null> {
    const [row] = await db
      .update(workspaces)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning();

    return row ? ((await this.findById(row.id)) as WorkspaceEntity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return deleted.length > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const [row] = await db
      .update(workspaces)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return !!row;
  }

  async restore(id: string): Promise<WorkspaceEntity | null> {
    const [row] = await db
      .update(workspaces)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return row ? ((await this.findById(row.id)) as WorkspaceEntity) : null;
  }

  async createVersion(
    workspaceId: string,
    versionNumber: number,
    action: string,
    snapshot: any,
    changedBy?: string | null
  ): Promise<void> {
    await db.insert(workspaceVersions).values({
      workspaceId,
      versionNumber,
      action,
      snapshot,
      changedBy: changedBy || null,
    });
  }

  async getLatestVersionNumber(workspaceId: string): Promise<number> {
    const [row] = await db
      .select({ versionNumber: workspaceVersions.versionNumber })
      .from(workspaceVersions)
      .where(eq(workspaceVersions.workspaceId, workspaceId))
      .orderBy(desc(workspaceVersions.versionNumber))
      .limit(1);

    return row ? row.versionNumber : 0;
  }

  async getVersion(workspaceId: string, versionNumber: number): Promise<any | null> {
    const [row] = await db
      .select()
      .from(workspaceVersions)
      .where(and(eq(workspaceVersions.workspaceId, workspaceId), eq(workspaceVersions.versionNumber, versionNumber)));

    return row || null;
  }

  async listVersions(workspaceId: string): Promise<any[]> {
    return await db
      .select()
      .from(workspaceVersions)
      .where(eq(workspaceVersions.workspaceId, workspaceId))
      .orderBy(desc(workspaceVersions.versionNumber));
  }
}
