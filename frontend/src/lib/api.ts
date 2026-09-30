// frontend/src/lib/api.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STORAGE_KEY = 'support_ia_api_key';
const DEFAULT_KEY = 'cle-api-test-123';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_KEY;
}

export function setApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export type ConversationStatus =
  | 'BOT'
  | 'PENDING_HUMAN'
  | 'HUMAN_ACTIVE'
  | 'RESOLVED'
  | 'CLOSED';

export type Category = 'BUG' | 'QUESTION' | 'RECLAMATION';

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokensUsed?: number | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userExternalId?: string | null;
  category?: Category | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  sourceUrl?: string | null;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

export interface TenantSettings {
  id: string;
  name: string;
  apiKey: string;
  botSystemPrompt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalTokensUsed: number;
  statuses: Record<ConversationStatus, number>;
  categories: Record<Category | 'UNCLASSIFIED', number>;
}

export interface SendMessageResponse {
  conversationId: string;
  reply: string;
  status: ConversationStatus;
  category?: Category | null;
  sources?: Array<{
    documentTitle: string;
    chunkContent: string;
    similarity: number;
  }>;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Erreur API: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export const api = {
  // Chat
  sendMessage: (
    content: string,
    conversationId?: string,
    userExternalId?: string,
    requestHuman?: boolean
  ): Promise<SendMessageResponse> =>
    request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message: content,
        conversationId,
        userExternalId,
        requestHuman,
      }),
    }),

  getConversations: (status?: ConversationStatus): Promise<Conversation[]> =>
    request(status ? `/chat/conversations?status=${status}` : '/chat/conversations'),

  getPendingConversations: (): Promise<Conversation[]> =>
    request('/chat/pending'),

  getConversationById: (id: string): Promise<Conversation> =>
    request(`/chat/conversations/${id}`),

  takeOver: (id: string, agentName: string = 'Sarah (Support)'): Promise<any> =>
    request(`/chat/conversations/${id}/take-over`, {
      method: 'POST',
      body: JSON.stringify({ agentName }),
    }),

  sendAgentMessage: (id: string, message: string): Promise<any> =>
    request(`/chat/conversations/${id}/agent-message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  resolveConversation: (id: string, returnToBot: boolean = false): Promise<any> =>
    request(`/chat/conversations/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ returnToBot }),
    }),

  escalateConversation: (id: string): Promise<any> =>
    request(`/chat/conversations/${id}/escalate`, {
      method: 'POST',
    }),

  getAnalytics: (): Promise<AnalyticsData> =>
    request('/chat/analytics'),

  // Knowledge Base
  getDocuments: (): Promise<KnowledgeDocument[]> =>
    request('/knowledge'),

  addDocument: (title: string, content: string, sourceUrl?: string): Promise<any> =>
    request('/knowledge/add', {
      method: 'POST',
      body: JSON.stringify({ title, content, sourceUrl }),
    }),

  uploadPdfDocument: async (file: File, title?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const apiKey = localStorage.getItem('assistant_ia_api_key') || 'cle-api-test-123';
    const res = await fetch(`${API_BASE}/knowledge/upload-pdf`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’ingestion du document PDF');
    }
    return res.json();
  },

  deleteDocument: (id: string): Promise<any> =>
    request(`/knowledge/${id}`, {
      method: 'DELETE',
    }),

  // Tenant Settings
  getTenantSettings: (): Promise<TenantSettings> =>
    request('/tenant/settings'),

  updateTenantSettings: (data: { name?: string; botSystemPrompt?: string }): Promise<any> =>
    request('/tenant/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
