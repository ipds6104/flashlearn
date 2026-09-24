import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { contents } from '../database/schema';
import { ContentEntity } from '../../domain/entities/Content';
import type {
  IContentRepository,
  CreateContentData,
  UpdateContentData,
} from '../../domain/ports/IContentRepository';
import type { ContentType, QuizQuestion } from '@flashlearn/shared';

export class DrizzleContentRepository implements IContentRepository {
  private mapToEntity(row: typeof contents.$inferSelect): ContentEntity {
    return new ContentEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      slug: row.slug,
      type: row.type as ContentType,
      summary: row.summary,
      readingTimeMinutes: row.readingTimeMinutes,
      body: row.body,
      questions: row.questions as QuizQuestion[] | null,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<ContentEntity | null> {
    const [row] = await db.select().from(contents).where(eq(contents.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async findBySlug(workspaceId: string, slug: string): Promise<ContentEntity | null> {
    const [row] = await db
      .select()
      .from(contents)
      .where(and(eq(contents.workspaceId, workspaceId), eq(contents.slug, slug)));
    return row ? this.mapToEntity(row) : null;
  }

  async listByWorkspace(workspaceId: string, onlyPublished = false): Promise<ContentEntity[]> {
    const conditions = [eq(contents.workspaceId, workspaceId)];
    if (onlyPublished) {
      conditions.push(eq(contents.isPublished, true));
    }

    const rows = await db
      .select()
      .from(contents)
      .where(and(...conditions))
      .orderBy(desc(contents.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateContentData): Promise<ContentEntity> {
    const [row] = await db
      .insert(contents)
      .values({
        workspaceId: data.workspaceId,
        title: data.title,
        slug: data.slug,
        type: data.type,
        summary: data.summary,
        readingTimeMinutes: data.readingTimeMinutes,
        body: data.body,
        questions: data.questions,
        isPublished: data.isPublished,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async update(id: string, data: UpdateContentData): Promise<ContentEntity | null> {
    const [row] = await db
      .update(contents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    return row ? this.mapToEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(contents).where(eq(contents.id, id)).returning();
    return deleted.length > 0;
  }
}
