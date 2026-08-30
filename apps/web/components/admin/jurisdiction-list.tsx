import type { Jurisdiction } from "@/lib/types";

export function JurisdictionList({ jurisdictions }: { jurisdictions: Jurisdiction[] }) {
  if (jurisdictions.length === 0) {
    return <p className="font-serif text-sm text-ink/50">No jurisdictions yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-rule-gray/60 rounded-md border border-rule-gray bg-white/40">
      {jurisdictions.map((jurisdiction) => {
        const isEmpty = jurisdiction.documentCount === 0;
        return (
          <li key={jurisdiction.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm text-ink">
                {jurisdiction.name}, {jurisdiction.state}
              </p>
              <p className="font-mono text-xs text-ink/50">{jurisdiction.slug}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-xs font-medium tracking-wide uppercase ${
                isEmpty ? "bg-flag-orange/15 text-flag-orange" : "bg-verified-green/15 text-verified-green"
              }`}
            >
              {jurisdiction.documentCount} {jurisdiction.documentCount === 1 ? "document" : "documents"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
