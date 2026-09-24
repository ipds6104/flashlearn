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

interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 25_000; // 25 seconds snappy cache

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = `${endpoint}_${auth.token || 'anon'}`;

  // Serve from memory cache instantly if fresh
  if (isGet) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

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

  const data = await res.json();

  if (isGet) {
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
  } else {
    // Invalidate memory cache on any mutation
    clearApiCache();
  }

  return data;
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
    rollback: (id: string, versionNumber?: number): Promise<Workspace> =>
      fetchWithAuth(`/api/v1/workspaces/${id}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ versionNumber }),
      }),
    restore: (id: string): Promise<Workspace> =>
      fetchWithAuth(`/api/v1/workspaces/${id}/restore`, { method: 'POST' }),
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
    rollback: (id: string, versionNumber?: number): Promise<Content> =>
      fetchWithAuth(`/api/v1/contents/${id}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ versionNumber }),
      }),
    restore: (id: string): Promise<Content> =>
      fetchWithAuth(`/api/v1/contents/${id}/restore`, { method: 'POST' }),
    getVersions: (id: string): Promise<any[]> =>
      fetchWithAuth(`/api/v1/contents/${id}/versions`),
    getSubmissions: (id: string): Promise<any[]> =>
      fetchWithAuth(`/api/v1/contents/${id}/submissions`),
    async downloadExport(id: string, format: 'xlsx' | 'csv' = 'xlsx') {
      const headers = new Headers();
      if (auth.token) {
        headers.set('Authorization', `Bearer ${auth.token}`);
      }
      const res = await fetch(`${API_URL}/api/v1/contents/${id}/export?format=${format}`, {
        headers,
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashlearn_submissions_${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
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
