"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessageAction, type SendMessageState } from "@/app/(app)/dashboard/[id]/chat/actions";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { SourcesRail } from "./sources-rail";

function lastAssistantId(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      return messages[i].id;
    }
  }
  return null;
}

export function ChatPane({ sessionId, initialMessages }: { sessionId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(() => lastAssistantId(initialMessages));
  const [state, formAction, isPending] = useActionState<SendMessageState | undefined, FormData>(sendMessageAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Adjust local state during render when a new action result arrives,
  // rather than in an effect — avoids an extra render pass and the
  // set-state-in-effect lint rule (same pattern as project-sidebar.tsx).
  const [lastHandled, setLastHandled] = useState(state?.respondedAt);
  if (state?.respondedAt !== lastHandled) {
    setLastHandled(state?.respondedAt);
    if (state?.userMessage && state?.assistantMessage) {
      setMessages((prev) => [...prev, state.userMessage!, state.assistantMessage!]);
      setSelectedMessageId(state.assistantMessage.id);
    }
  }

  // Imperative DOM work (form reset, scroll) stays in an effect.
  useEffect(() => {
    if (state?.userMessage) {
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) ?? null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10">
          {messages.length === 0 ? (
            <p className="font-serif text-sm text-ink/50">
              Ask a question about this project. Answers are grounded in the county rulebook, your firm&rsquo;s experience,
              this project&rsquo;s documents, and public precedent.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {messages.map((message) => (
                <li key={message.id}>
                  <MessageBubble
                    message={message}
                    selected={message.id === selectedMessageId}
                    onSelect={() => setSelectedMessageId(message.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <form ref={formRef} action={formAction} className="border-t border-rule-gray px-6 py-4 md:px-10">
          <input type="hidden" name="sessionId" value={sessionId} />
          <div className="flex items-end gap-3">
            <label htmlFor="chat-message" className="sr-only">
              Ask a question
            </label>
            <textarea
              id="chat-message"
              name="content"
              required
              rows={2}
              placeholder="Ask a question about this project…"
              className="flex-1 resize-none rounded-md border border-rule-gray bg-white px-3 py-2 font-serif text-sm text-ink outline-none focus-visible:border-survey-blue focus-visible:ring-2 focus-visible:ring-survey-blue"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-survey-blue px-4 py-2 font-sans text-sm font-medium text-vellum transition-colors hover:bg-survey-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send"}
            </button>
          </div>
          {state?.error ? (
            <p role="alert" className="mt-2 font-sans text-sm text-flag-orange">
              {state.error}
            </p>
          ) : null}
        </form>
      </div>

      <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-rule-gray lg:block">
        <SourcesRail message={selectedMessage} />
      </aside>
    </div>
  );
}
