import type { Jurisdiction } from "@/lib/types";

// A plain GET form — works with zero JS (submit navigates to
// `${action}?jurisdictionId=...`), and is what actually decides which
// jurisdiction's documents the page fetches server-side. Kept visible even
// when there's only one jurisdiction, so it's never silently hardcoded.
export function JurisdictionFilter({
  jurisdictions,
  selectedId,
  action,
}: {
  jurisdictions: Jurisdiction[];
  selectedId: string;
  action: string;
}) {
  return (
    <form method="GET" action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="jurisdictionId" className="font-sans text-xs font-medium tracking-wide text-ink/70 uppercase">
          Jurisdiction
        </label>
        <select
          id="jurisdictionId"
          name="jurisdictionId"
          defaultValue={selectedId}
          className="min-w-64 rounded-sm border border-rule-gray bg-white px-3 py-2 font-serif text-sm text-ink outline-none focus-visible:border-survey-blue focus-visible:ring-2 focus-visible:ring-survey-blue"
        >
          {jurisdictions.map((jurisdiction) => (
            <option key={jurisdiction.id} value={jurisdiction.id}>
              {jurisdiction.name}, {jurisdiction.state}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-sm border border-survey-blue px-3 py-2 font-sans text-sm font-medium text-survey-blue transition-colors hover:bg-survey-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue"
      >
        View
      </button>
    </form>
  );
}
