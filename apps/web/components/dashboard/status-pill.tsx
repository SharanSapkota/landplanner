export function StatusPill({ status }: { status: string }) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-xs font-medium tracking-wide uppercase ${
        isActive ? "bg-verified-green/15 text-verified-green" : "bg-rule-gray/40 text-ink/60"
      }`}
    >
      {status}
    </span>
  );
}
