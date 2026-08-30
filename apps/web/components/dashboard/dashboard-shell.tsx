"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Master-detail responsive behavior: on mobile, show either the project
// list or the selected project's detail, never both — on /dashboard (no
// selection) show the list full-width, on /dashboard/[id] show the detail
// full-width. From md: up, both are shown side by side regardless of route.
export function DashboardShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const isDetailView = pathname !== "/dashboard";

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside
        className={`${isDetailView ? "hidden md:flex" : "flex"} w-full flex-col overflow-y-auto border-rule-gray md:w-80 md:flex-shrink-0 md:border-r`}
      >
        {sidebar}
      </aside>
      <main className={`${isDetailView ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-y-auto`}>{children}</main>
    </div>
  );
}
