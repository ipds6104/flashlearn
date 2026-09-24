import { eq } from 'drizzle-orm';
import { db } from '../database/db';
import { users } from '../database/schema';
import { UserEntity } from '../../domain/entities/User';
import type { IUserRepository, CreateUserData } from '../../domain/ports/IUserRepository';
import type { UserRole } from '@flashlearn/shared';

export class DrizzleUserRepository implements IUserRepository {
  private mapToEntity(row: typeof users.$inferSelect): UserEntity {
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      role: row.role as UserRole,
      googleId: row.googleId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row ? this.mapToEntity(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const [row] = await db.select().from(users).where(eq(users.googleId, googleId));
    return row ? this.mapToEntity(row) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const [row] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
        googleId: data.googleId,
      })
      .returning();
    return this.mapToEntity(row);
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity | null> {
    const [row] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row ? this.mapToEntity(row) : null;
  }

  async listAll(): Promise<UserEntity[]> {
    const rows = await db.select().from(users).orderBy(users.createdAt);
    return rows.map((r) => this.mapToEntity(r));
  }
}
