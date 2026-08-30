import { MonumentStamp } from "./monument-stamp";

// Scope vs. trust are different concepts (CLAUDE.md §5/§10) — this badge is
// for trustLevel only ('official' | 'verified' | 'unverified'), never scope.
// Not used on the Projects screens (Project has no trustLevel) — this is the
// design-system primitive for the document/chat screens that will need it.
const TRUST_STYLES: Record<string, { label: string; className: string; showStamp: boolean }> = {
  official: { label: "Official", className: "text-survey-blue", showStamp: true },
  verified: { label: "Verified", className: "text-verified-green", showStamp: true },
  unverified: { label: "Unverified", className: "text-flag-orange", showStamp: false },
};

export function TrustBadge({ trustLevel }: { trustLevel: string }) {
  const style = TRUST_STYLES[trustLevel] ?? { label: trustLevel, className: "text-ink/70", showStamp: false };

  return (
    <span className={`inline-flex items-center gap-1 font-sans text-xs font-medium tracking-wide uppercase ${style.className}`}>
      {style.showStamp ? <MonumentStamp className="h-3.5 w-3.5" title={style.label} /> : null}
      {style.label}
    </span>
  );
}
