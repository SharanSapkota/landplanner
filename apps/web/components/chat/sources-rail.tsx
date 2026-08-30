import type { ChatMessage } from "@/lib/types";
import { SourceCard } from "./source-card";

export function SourcesRail({ message }: { message: ChatMessage | null }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      <h2 className="mb-4 font-sans text-xs font-semibold tracking-wider text-ink/50 uppercase">Sources</h2>

      {!message || message.role !== "assistant" ? (
        <p className="font-serif text-sm text-ink/50">Select an assistant reply to see the sources it cited.</p>
      ) : message.sources.length === 0 ? (
        <p className="font-serif text-sm text-ink/50">This reply did not cite any sources.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {message.sources.map((source) => (
            <li key={source.chunkId}>
              <SourceCard source={source} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
