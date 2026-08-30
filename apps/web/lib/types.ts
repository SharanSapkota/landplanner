export interface Project {
  id: string;
  organizationId: string;
  jurisdictionId: string;
  createdById: string;
  name: string;
  address: string | null;
  projectType: string | null;
  status: string;
  createdAt: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  slug: string;
  documentCount: number;
}

export type DocumentScope = "rulebook" | "firm_experience" | "project" | "public_precedent";
export type TrustLevel = "official" | "verified" | "unverified";
export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export interface Document {
  id: string;
  scope: DocumentScope;
  organizationId: string | null;
  jurisdictionId: string;
  projectId: string | null;
  uploadedById: string;
  fileName: string;
  storagePath: string;
  docType: string;
  trustLevel: TrustLevel;
  processingStatus: ProcessingStatus;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  jurisdictionId: string;
  projectId: string | null;
  title: string | null;
  createdAt: string;
}

// Resolved display metadata for a chunk cited by an assistant message —
// mirrors the API's CitedSource shape (see chat.service.ts).
export interface CitedSource {
  chunkId: string;
  documentId: string;
  fileName: string;
  docType: string;
  scope: DocumentScope;
  trustLevel: TrustLevel;
  sectionTitle: string | null;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  citedChunkIds: string[];
  sources: CitedSource[];
  createdAt: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}
