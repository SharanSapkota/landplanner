import type { ChatMessage } from "@/lib/types";
import { renderWithCodeCitations } from "./render-with-code-citations";
import { SourceCard } from "./source-card";

export function MessageBubble({
  message,
  selected,
  onSelect,
}: {
  message: ChatMessage;
  selected: boolean;
  onSelect: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-2xl ${isUser ? "" : "w-full"}`}>
        <button
          type="button"
          onClick={onSelect}
          disabled={isUser}
          aria-pressed={isUser ? undefined : selected}
          className={`block w-full rounded-lg px-4 py-3 text-left font-serif text-sm leading-relaxed whitespace-pre-wrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue ${
            isUser
              ? "bg-survey-blue text-vellum"
              : `bg-white text-ink ring-1 transition-colors ${selected ? "ring-2 ring-survey-blue" : "ring-rule-gray hover:ring-survey-blue/50"}`
          }`}
        >
          {isUser ? message.content : renderWithCodeCitations(message.content)}
        </button>

        {/* Sources rail is hidden below lg; assistant messages carry their
            citations inline here instead so mobile never loses access to them. */}
        {!isUser && message.sources.length > 0 ? (
          <div className="mt-2 lg:hidden">
            <p className="mb-1.5 font-sans text-xs font-medium tracking-wide text-ink/50 uppercase">Sources</p>
            <div className="flex flex-col gap-2">
              {message.sources.map((source) => (
                <SourceCard key={source.chunkId} source={source} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
