import { and, desc, eq } from 'drizzle-orm';
import type { ProjectMissionCritique, ProjectMissionSubmission } from '@flashlearn/shared';
import { db } from '../database/db';
import { projectMissionSubmissions } from '../database/schema';
import type { LearnerIdentity } from '../../domain/ports/IInteractiveRepository';
import type {
  IProjectSubmissionRepository,
  UpsertProjectSubmissionData,
} from '../../domain/ports/IProjectSubmissionRepository';

export class DrizzleProjectSubmissionRepository implements IProjectSubmissionRepository {
  private mapRow(row: typeof projectMissionSubmissions.$inferSelect): ProjectMissionSubmission {
    return {
      id: row.id,
      contentId: row.contentId,
      userId: row.userId,
      sessionKey: row.sessionKey,
      status: row.status,
      checkedMilestoneIds: Array.isArray(row.checkedMilestoneIds) ? row.checkedMilestoneIds : [],
      checkedRubricIds: Array.isArray(row.checkedRubricIds) ? row.checkedRubricIds : [],
      artifactUrl: row.artifactUrl ?? null,
      artifactNotes: row.artifactNotes ?? null,
      selfReflection: row.selfReflection ?? null,
      aiCritique: (row.aiCritique as ProjectMissionCritique | null) ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async findExistingRow(contentId: string, identity: LearnerIdentity) {
    if (identity.userId) {
      const [row] = await db
        .select()
        .from(projectMissionSubmissions)
        .where(
          and(
            eq(projectMissionSubmissions.contentId, contentId),
            eq(projectMissionSubmissions.userId, identity.userId)
          )
        )
        .orderBy(desc(projectMissionSubmissions.updatedAt))
        .limit(1);
      if (row) return row;
    }
    if (identity.sessionKey) {
      const [row] = await db
        .select()
        .from(projectMissionSubmissions)
        .where(
          and(
            eq(projectMissionSubmissions.contentId, contentId),
            eq(projectMissionSubmissions.sessionKey, identity.sessionKey)
          )
        )
        .orderBy(desc(projectMissionSubmissions.updatedAt))
        .limit(1);
      if (row) return row;
    }
    return null;
  }

  async findByLearner(
    contentId: string,
    identity: LearnerIdentity
  ): Promise<ProjectMissionSubmission | null> {
    const row = await this.findExistingRow(contentId, identity);
    return row ? this.mapRow(row) : null;
  }

  async upsertByLearner(
    contentId: string,
    identity: LearnerIdentity,
    data: UpsertProjectSubmissionData
  ): Promise<ProjectMissionSubmission> {
    const existing = await this.findExistingRow(contentId, identity);
    const now = new Date();

    if (existing) {
      const [updated] = await db
        .update(projectMissionSubmissions)
        .set({
          userId: identity.userId ?? existing.userId,
          sessionKey: identity.sessionKey ?? existing.sessionKey,
          status: data.status,
          checkedMilestoneIds: data.checkedMilestoneIds,
          checkedRubricIds: data.checkedRubricIds,
          artifactUrl: data.artifactUrl,
          artifactNotes: data.artifactNotes,
          selfReflection: data.selfReflection,
          updatedAt: now,
        })
        .where(eq(projectMissionSubmissions.id, existing.id))
        .returning();
      return this.mapRow(updated);
    }

    const [created] = await db
      .insert(projectMissionSubmissions)
      .values({
        contentId,
        userId: identity.userId ?? null,
        sessionKey: identity.sessionKey ?? null,
        status: data.status,
        checkedMilestoneIds: data.checkedMilestoneIds,
        checkedRubricIds: data.checkedRubricIds,
        artifactUrl: data.artifactUrl,
        artifactNotes: data.artifactNotes,
        selfReflection: data.selfReflection,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapRow(created);
  }

  async saveCritique(
    contentId: string,
    identity: LearnerIdentity,
    critique: ProjectMissionCritique
  ): Promise<ProjectMissionSubmission | null> {
    const existing = await this.findExistingRow(contentId, identity);
    if (!existing) return null;
    const [updated] = await db
      .update(projectMissionSubmissions)
      .set({
        aiCritique: critique,
        updatedAt: new Date(),
      })
      .where(eq(projectMissionSubmissions.id, existing.id))
      .returning();
    return updated ? this.mapRow(updated) : null;
  }
}
