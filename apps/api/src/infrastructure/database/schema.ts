import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import type { QuizQuestion } from '@flashlearn/shared';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['superadmin', 'creator', 'guest'] }).default('creator').notNull(),
  googleId: text('google_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImage: text('cover_image'),
  icon: text('icon'),
  isPublic: boolean('is_public').default(true).notNull(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contents = pgTable('contents', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  type: text('type', { enum: ['materi', 'quiz', 'combined'] }).notNull(),
  summary: text('summary'),
  readingTimeMinutes: integer('reading_time_minutes').default(5),
  body: text('body'), // Markdown body for 'materi' & 'combined'
  questions: jsonb('questions').$type<QuizQuestion[]>(), // Array of QuizQuestion
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  hashedKey: text('hashed_key').notNull().unique(),
  permissions: jsonb('permissions').$type<string[]>().default(['*']).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
