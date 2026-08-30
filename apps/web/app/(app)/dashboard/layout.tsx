import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProjectSidebar } from "@/components/dashboard/project-sidebar";
import { listJurisdictions, listProjects } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const [projects, jurisdictions] = await Promise.all([listProjects(token), listJurisdictions(token)]);

  return (
    <DashboardShell sidebar={<ProjectSidebar projects={projects} jurisdictions={jurisdictions} />}>
      {children}
    </DashboardShell>
  );
}
