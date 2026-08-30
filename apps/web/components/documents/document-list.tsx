import { TrustBadge } from "@/components/ui/trust-badge";
import type { Document } from "@/lib/types";
import { ProcessingStatusBadge } from "./processing-status-badge";

export function DocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return <p className="font-serif text-sm text-ink/50">No documents uploaded yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-rule-gray/60 rounded-md border border-rule-gray bg-white/40">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-sm text-ink">{doc.fileName}</p>
            <p className="font-mono text-xs text-ink/50">{doc.docType}</p>
          </div>
          <div className="flex items-center gap-3">
            <TrustBadge trustLevel={doc.trustLevel} />
            <ProcessingStatusBadge status={doc.processingStatus} />
          </div>
        </li>
      ))}
    </ul>
  );
}
