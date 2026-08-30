import { TrustBadge } from "@/components/ui/trust-badge";
import type { CitedSource } from "@/lib/types";

// CLAUDE.md §4/§10: scope and trustLevel are distinct concepts — this card
// always shows both, never collapses them into one label.
const SCOPE_LABELS: Record<string, string> = {
  rulebook: "County Rulebook",
  firm_experience: "Firm Experience",
  project: "This Project",
  public_precedent: "Public Precedent",
};

export function SourceCard({ source }: { source: CitedSource }) {
  return (
    <div className="rounded-md border border-rule-gray bg-white/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-sans text-[11px] font-semibold tracking-wide text-survey-blue uppercase">
          {SCOPE_LABELS[source.scope] ?? source.scope}
        </span>
      </div>

      <p className="mt-1.5 truncate font-serif text-sm text-ink" title={source.fileName}>
        {source.fileName}
      </p>

      {source.sectionTitle ? <p className="mt-0.5 font-mono text-xs text-ink/60">{source.sectionTitle}</p> : null}

      <div className="mt-2">
        <TrustBadge trustLevel={source.trustLevel} />
      </div>

      {source.scope === "public_precedent" ? (
        <p className="mt-1.5 font-serif text-xs text-ink/50 italic">Based on public records, not independently verified.</p>
      ) : null}
    </div>
  );
}
