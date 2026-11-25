import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import type { ProjectMissionCritique, ProjectSubmissionStatus } from '@flashlearn/shared';
import { users } from './core';
import { contents } from './contents';

export const projectMissionSubmissions = pgTable(
  'project_mission_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id')
      .references(() => contents.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sessionKey: text('session_key'),
    status: text('status', { enum: ['in_progress', 'completed'] })
      .$type<ProjectSubmissionStatus>()
      .default('in_progress')
      .notNull(),
    checkedMilestoneIds: jsonb('checked_milestone_ids').$type<string[]>().default([]).notNull(),
    checkedRubricIds: jsonb('checked_rubric_ids').$type<string[]>().default([]).notNull(),
    artifactUrl: text('artifact_url'),
    artifactNotes: text('artifact_notes'),
    selfReflection: text('self_reflection'),
    aiCritique: jsonb('ai_critique').$type<ProjectMissionCritique>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_pms_content_id').on(table.contentId),
    index('idx_pms_user_content').on(table.userId, table.contentId),
    index('idx_pms_session_content').on(table.sessionKey, table.contentId),
  ]
);
