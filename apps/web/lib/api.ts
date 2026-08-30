import 'server-only';
import { redirect } from 'next/navigation';
import type { ChatMessage, ChatSession, ChatSessionWithMessages, Document, DocumentScope, Jurisdiction, Project, TrustLevel } from './types';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export type LoginResult =
  | { ok: true; data: LoginResponse }
  | { ok: false; status: number; message: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { ok: false, status: 0, message: 'Could not reach the server. Please try again.' };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? 'Login failed.');
    return { ok: false, status: response.status, message };
  }

  return { ok: true, data: body as LoginResponse };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Authenticated fetch helper for Server Components/Actions — attaches the
// bearer token from the caller (read from the httpOnly session cookie by
// the caller, never here) and never caches, since every response is
// tenant/user-scoped. A 401 means the session is no longer valid on the API
// side even though the cookie itself hasn't expired yet (e.g. the user was
// deleted) — bounce to /login rather than surface a confusing error.
async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/login');
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? `Request failed (${response.status})`);
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export async function listProjects(token: string): Promise<Project[]> {
  return apiFetch<Project[]>('/projects', token);
}

export async function getProject(token: string, id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, token);
}

export async function listJurisdictions(token: string): Promise<Jurisdiction[]> {
  return apiFetch<Jurisdiction[]>('/jurisdictions', token);
}

export interface CreateJurisdictionInput {
  name: string;
  state: string;
  slug: string;
}

export async function createJurisdiction(token: string, input: CreateJurisdictionInput): Promise<Jurisdiction> {
  return apiFetch<Jurisdiction>('/jurisdictions', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export interface CreateProjectInput {
  name: string;
  jurisdictionId: string;
  address?: string;
  projectType?: string;
}

export async function createProject(token: string, input: CreateProjectInput): Promise<Project> {
  return apiFetch<Project>('/projects', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export interface ListDocumentsParams {
  scope: DocumentScope;
  jurisdictionId?: string;
  projectId?: string;
}

export async function listDocuments(token: string, params: ListDocumentsParams): Promise<Document[]> {
  const search = new URLSearchParams({ scope: params.scope });
  if (params.jurisdictionId) search.set('jurisdictionId', params.jurisdictionId);
  if (params.projectId) search.set('projectId', params.projectId);

  return apiFetch<Document[]>(`/documents?${search.toString()}`, token);
}

export interface UploadDocumentInput {
  file: File;
  scope: DocumentScope;
  docType: string;
  jurisdictionId?: string;
  projectId?: string;
  trustLevel?: TrustLevel;
}

export async function uploadDocument(token: string, input: UploadDocumentInput): Promise<Document> {
  const form = new FormData();
  form.set('file', input.file, input.file.name);
  form.set('scope', input.scope);
  form.set('docType', input.docType);
  if (input.jurisdictionId) form.set('jurisdictionId', input.jurisdictionId);
  if (input.projectId) form.set('projectId', input.projectId);
  if (input.trustLevel) form.set('trustLevel', input.trustLevel);

  // No Content-Type header set deliberately — fetch derives the correct
  // multipart boundary from the FormData body itself; setting it manually
  // would break the boundary.
  return apiFetch<Document>('/documents', token, { method: 'POST', body: form });
}

export async function listChatSessions(token: string): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>('/chat/sessions', token);
}

export interface CreateChatSessionInput {
  jurisdictionId?: string;
  projectId?: string;
  title?: string;
}

export async function createChatSession(token: string, input: CreateChatSessionInput): Promise<ChatSession> {
  return apiFetch<ChatSession>('/chat/sessions', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getChatSession(token: string, sessionId: string): Promise<ChatSessionWithMessages> {
  return apiFetch<ChatSessionWithMessages>(`/chat/sessions/${sessionId}`, token);
}

export async function sendChatMessage(token: string, sessionId: string, content: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/chat/sessions/${sessionId}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// Phase 1 doesn't have a session-picker UI (CLAUDE.md keeps this narrow) —
// each project has exactly one ongoing conversation, reused across visits
// rather than accumulating throwaway sessions every time the chat page loads.
export async function findOrCreateProjectChatSession(token: string, projectId: string): Promise<ChatSession> {
  const sessions = await listChatSessions(token);
  const existing = sessions.find((session) => session.projectId === projectId);
  if (existing) {
    return existing;
  }
  return createChatSession(token, { projectId });
}
