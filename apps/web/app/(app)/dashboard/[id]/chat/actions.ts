"use server";

import { redirect } from "next/navigation";
import { ApiError, sendChatMessage } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { ChatMessage } from "@/lib/types";

export interface SendMessageState {
  error?: string;
  // Bumped on every successful call so the client can detect a fresh result
  // even if userContent happens to repeat — see chat-pane.tsx.
  respondedAt?: number;
  userMessage?: ChatMessage;
  assistantMessage?: ChatMessage;
}

// The backend only returns the assistant's reply (see chat.service.ts) — the
// user's own message is built here from the content we just sent, since we
// already know exactly what it says. It's still the real POST that created
// and persisted it; this just avoids a redundant round trip to read it back.
export async function sendMessageAction(_prevState: SendMessageState | undefined, formData: FormData): Promise<SendMessageState> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!content) {
    return { error: "Type a question first." };
  }

  let assistantMessage: ChatMessage;
  try {
    assistantMessage = await sendChatMessage(token, sessionId, content);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Failed to send the message." };
  }

  const userMessage: ChatMessage = {
    id: `local-user-${Date.now()}`,
    sessionId,
    role: "user",
    content,
    citedChunkIds: [],
    sources: [],
    createdAt: new Date().toISOString(),
  };

  return { respondedAt: Date.now(), userMessage, assistantMessage };
}
