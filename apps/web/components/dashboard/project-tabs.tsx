"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/dashboard/${projectId}`, label: "Overview" },
    { href: `/dashboard/${projectId}/chat`, label: "Chat" },
  ];

  return (
    <nav className="mt-6 flex gap-6" aria-label="Project sections">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-1 pb-3 font-sans text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue ${
              active ? "border-survey-blue text-ink" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
