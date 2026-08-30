"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Jurisdiction, Project } from "@/lib/types";
import { NewProjectDialog } from "./new-project-dialog";

export function ProjectSidebar({ projects, jurisdictions }: { projects: Project[]; jurisdictions: Jurisdiction[] }) {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Close the dialog whenever navigation happens, including the redirect a
  // successful creation triggers — the sidebar persists across that
  // navigation (same layout), so nothing else would close it. Adjusting
  // state during render (React's recommended pattern for "reset on prop
  // change") rather than in an effect, to avoid the extra render pass.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDialogOpen(false);
  }

  const jurisdictionName = (id: string) => {
    const jurisdiction = jurisdictions.find((j) => j.id === id);
    return jurisdiction ? `${jurisdiction.name}, ${jurisdiction.state}` : "Unknown jurisdiction";
  };

  const grouped = new Map<string, Project[]>();
  for (const project of projects) {
    const group = grouped.get(project.jurisdictionId) ?? [];
    group.push(project);
    grouped.set(project.jurisdictionId, group);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {projects.length === 0 ? (
          <p className="font-sans text-sm text-ink/60">No projects yet.</p>
        ) : (
          Array.from(grouped.entries()).map(([jurisdictionId, group]) => (
            <div key={jurisdictionId} className="mb-6">
              <h2 className="mb-2 px-3 font-sans text-xs font-semibold tracking-wider text-ink/50 uppercase">
                {jurisdictionName(jurisdictionId)}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {group.map((project) => {
                  const active = pathname === `/dashboard/${project.id}` || pathname.startsWith(`/dashboard/${project.id}/`);
                  return (
                    <li key={project.id}>
                      <Link
                        href={`/dashboard/${project.id}`}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-sm px-3 py-2 font-sans text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue ${
                          active ? "bg-survey-blue text-vellum" : "text-ink hover:bg-rule-gray/30"
                        }`}
                      >
                        {project.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-rule-gray p-4">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-sm bg-survey-blue px-3 py-2 font-sans text-sm font-medium text-vellum transition-colors hover:bg-survey-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue"
        >
          + New project
        </button>
      </div>

      {dialogOpen ? <NewProjectDialog jurisdictions={jurisdictions} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  );
}
