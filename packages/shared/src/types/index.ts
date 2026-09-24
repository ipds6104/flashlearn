export type UserRole = 'superadmin' | 'creator' | 'guest';

export type ContentType = 'materi' | 'quiz' | 'combined';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  icon: string | null;
  isPublic: boolean;
  creatorId: string;
  creatorName?: string;
  creatorEmail?: string;
  contentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Hidden for learners before submission
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Content {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  type: ContentType;
  summary: string | null;
  readingTimeMinutes: number | null;
  body: string | null; // Markdown for 'materi' and 'combined'
  questions: QuizQuestion[] | null; // Questions for 'quiz' and 'combined'
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswerSubmission {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizSubmissionRequest {
  answers: QuizAnswerSubmission[];
}

export interface QuestionReviewItem {
  questionId: string;
  question: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResultResponse {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  reviews: QuestionReviewItem[];
}

export interface FlashcardItem {
  id: string;
  questionId: string;
  front: string; // The Question prompt
  back: string;  // The Correct answer text
  explanation: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  key: string; // Secret fl_live_... (Shown only once)
  apiKey: ApiKeyItem;
}

// Request DTOs
export interface GoogleAuthRequest {
  credential: string; // Google Identity Services JWT ID Token
}

export interface AuthSessionResponse {
  token: string;
  user: User;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface CreateContentRequest {
  workspaceId: string;
  title: string;
  slug?: string;
  type: ContentType;
  summary?: string;
  readingTimeMinutes?: number;
  body?: string;
  questions?: QuizQuestion[];
  isPublished?: boolean;
}

export interface UpdateContentRequest {
  title?: string;
  slug?: string;
  type?: ContentType;
  summary?: string;
  readingTimeMinutes?: number;
  body?: string;
  questions?: QuizQuestion[];
  isPublished?: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresInDays?: number;
}
