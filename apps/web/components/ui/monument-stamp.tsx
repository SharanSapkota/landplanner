// The signature element of the design system: a small circular "monument
// stamp," evoking a surveyor's stamped benchmark disk (rim, inner ring,
// center punch mark, four rim ticks). Reserved for trustLevel = 'verified'
// or 'official' — never a generic checkmark substitute elsewhere. Inherits
// color via currentColor, so wrap it in an element with the right text color.
export function MonumentStamp({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" />
      <line x1="12" y1="1.25" x2="12" y2="3.35" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="12" y1="20.65" x2="12" y2="22.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="1.25" y1="12" x2="3.35" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="20.65" y1="12" x2="22.75" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
