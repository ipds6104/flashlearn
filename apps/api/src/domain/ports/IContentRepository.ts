import type { ContentEntity } from '../entities/Content';
import type { ContentType, QuizQuestion } from '@flashlearn/shared';

export interface CreateContentData {
  workspaceId: string;
  title: string;
  slug: string;
  type: ContentType;
  summary?: string | null;
  readingTimeMinutes?: number | null;
  body?: string | null;
  questions?: QuizQuestion[] | null;
  isPublished: boolean;
}

export interface UpdateContentData {
  title?: string;
  slug?: string;
  type?: ContentType;
  summary?: string | null;
  readingTimeMinutes?: number | null;
  body?: string | null;
  questions?: QuizQuestion[] | null;
  isPublished?: boolean;
}

export interface IContentRepository {
  findById(id: string): Promise<ContentEntity | null>;
  findBySlug(workspaceId: string, slug: string): Promise<ContentEntity | null>;
  listByWorkspace(workspaceId: string, onlyPublished?: boolean): Promise<ContentEntity[]>;
  create(data: CreateContentData): Promise<ContentEntity>;
  update(id: string, data: UpdateContentData): Promise<ContentEntity | null>;
  delete(id: string): Promise<boolean>;
}
