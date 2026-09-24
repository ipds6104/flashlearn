import { auth } from './auth.svelte';
import type {
  Workspace,
  Content,
  QuizSubmissionRequest,
  QuizResultResponse,
  FlashcardItem,
  ApiKeyItem,
  CreateApiKeyResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateContentRequest,
  UpdateContentRequest,
  CreateApiKeyRequest,
} from '@flashlearn/shared';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port !== '5173' ? '' : 'http://localhost:3001');

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (auth.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  workspaces: {
    list: (scope: 'public' | 'mine' | 'all' = 'public'): Promise<Workspace[]> =>
      fetchWithAuth(`/api/v1/workspaces?scope=${scope}`),
    get: (idOrSlug: string): Promise<Workspace> =>
      fetchWithAuth(`/api/v1/workspaces/${idOrSlug}`),
    create: (data: CreateWorkspaceRequest): Promise<Workspace> =>
      fetchWithAuth('/api/v1/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> =>
      fetchWithAuth(`/api/v1/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<{ success: boolean }> =>
      fetchWithAuth(`/api/v1/workspaces/${id}`, { method: 'DELETE' }),
  },
  contents: {
    listByWorkspace: (workspaceId: string): Promise<Content[]> =>
      fetchWithAuth(`/api/v1/contents/workspace/${workspaceId}`),
    get: (id: string): Promise<Content> =>
      fetchWithAuth(`/api/v1/contents/${id}`),
    create: (data: CreateContentRequest): Promise<Content> =>
      fetchWithAuth('/api/v1/contents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateContentRequest): Promise<Content> =>
      fetchWithAuth(`/api/v1/contents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<{ success: boolean }> =>
      fetchWithAuth(`/api/v1/contents/${id}`, { method: 'DELETE' }),
    checkGuestName: (id: string, name: string): Promise<{ isTaken: boolean; suggestedName: string }> =>
      fetchWithAuth(`/api/v1/contents/${id}/check-name`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    submitQuiz: (id: string, submission: QuizSubmissionRequest): Promise<QuizResultResponse> =>
      fetchWithAuth(`/api/v1/contents/${id}/submit-quiz`, {
        method: 'POST',
        body: JSON.stringify(submission),
      }),
    getFlashcards: (id: string): Promise<FlashcardItem[]> =>
      fetchWithAuth(`/api/v1/contents/${id}/flashcards`),
  },
  apiKeys: {
    list: (): Promise<ApiKeyItem[]> =>
      fetchWithAuth('/api/v1/api-keys'),
    create: (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
      fetchWithAuth('/api/v1/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    revoke: (id: string): Promise<{ success: boolean }> =>
      fetchWithAuth(`/api/v1/api-keys/${id}`, { method: 'DELETE' }),
  },
};
