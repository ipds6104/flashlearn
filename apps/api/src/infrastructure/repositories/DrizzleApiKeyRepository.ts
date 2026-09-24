import { eq, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { apiKeys } from '../database/schema';
import { ApiKeyEntity } from '../../domain/entities/ApiKey';
import type { IApiKeyRepository, CreateApiKeyData } from '../../domain/ports/IApiKeyRepository';

export class DrizzleApiKeyRepository implements IApiKeyRepository {
  private mapToEntity(row: typeof apiKeys.$inferSelect): ApiKeyEntity {
    return new ApiKeyEntity({
      id: row.id,
      userId: row.userId,
      name: row.name,
      keyPrefix: row.keyPrefix,
      hashedKey: row.hashedKey,
      permissions: row.permissions as string[],
      expiresAt: row.expiresAt,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<ApiKeyEntity | null> {
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKeyEntity | null> {
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.hashedKey, hashedKey));
    return row ? this.mapToEntity(row) : null;
  }

  async listByUser(userId: string): Promise<ApiKeyEntity[]> {
    const rows = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
    return rows.map((r) => this.mapToEntity(r));
  }

  async listAll(): Promise<ApiKeyEntity[]> {
    const rows = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateApiKeyData): Promise<ApiKeyEntity> {
    const [row] = await db
      .insert(apiKeys)
      .values({
        userId: data.userId,
        name: data.name,
        keyPrefix: data.keyPrefix,
        hashedKey: data.hashedKey,
        permissions: data.permissions,
        expiresAt: data.expiresAt,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async updateLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
    return deleted.length > 0;
  }
}
