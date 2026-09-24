import { eq, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { workspaces, users, contents } from '../database/schema';
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
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
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(eq(workspaces.id, id));

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
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(eq(workspaces.slug, slug));

    return row ? this.mapToEntity(row) : null;
  }

  async listPublic(): Promise<WorkspaceEntity[]> {
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
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(eq(workspaces.isPublic, true))
      .orderBy(desc(workspaces.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listByCreator(creatorId: string): Promise<WorkspaceEntity[]> {
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
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .where(eq(workspaces.creatorId, creatorId))
      .orderBy(desc(workspaces.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listAll(): Promise<WorkspaceEntity[]> {
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
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.creatorId, users.id))
      .orderBy(desc(workspaces.createdAt));

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

    return this.findById(row.id) as Promise<WorkspaceEntity>;
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

    return row ? (this.findById(row.id) as Promise<WorkspaceEntity>) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return deleted.length > 0;
  }
}
