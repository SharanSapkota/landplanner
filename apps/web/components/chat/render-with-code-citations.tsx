import type { ReactNode } from "react";

// Matches regulatory code citations inline in prose — e.g. "KCC 19.700.725",
// "RCW 58.17.020": a short uppercase abbreviation followed by a
// dot-delimited numeric section reference. Rendered in IBM Plex Mono to set
// it apart from the surrounding Source Serif 4 prose, per the design system.
const CODE_CITATION_PATTERN = /\b[A-Z]{2,6}\s\d+(?:\.\d+)+\b/g;

export function renderWithCodeCitations(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(CODE_CITATION_PATTERN)) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <span key={key++} className="font-mono text-[0.85em] text-survey-blue">
        {match[0]}
      </span>,
    );
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
