const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-rule-gray/40 text-ink/60" },
  processing: { label: "Processing", className: "bg-survey-blue/15 text-survey-blue" },
  ready: { label: "Ready", className: "bg-verified-green/15 text-verified-green" },
  failed: { label: "Failed", className: "bg-flag-orange/15 text-flag-orange" },
};

export function ProcessingStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: "bg-rule-gray/40 text-ink/60" };

  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-xs font-medium tracking-wide uppercase ${style.className}`}>
      {style.label}
    </span>
  );
}
