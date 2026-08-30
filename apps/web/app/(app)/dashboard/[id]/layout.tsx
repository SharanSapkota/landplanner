import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProjectTabs } from "@/components/dashboard/project-tabs";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ApiError, getProject, listJurisdictions } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default async function ProjectLayout(props: LayoutProps<"/dashboard/[id]">) {
  const { id } = await props.params;
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  let project;
  try {
    project = await getProject(token, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const jurisdictions = await listJurisdictions(token);
  const jurisdiction = jurisdictions.find((j) => j.id === project.jurisdictionId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-rule-gray px-6 py-4 md:hidden">
        <Link href="/dashboard" className="font-sans text-sm text-survey-blue underline-offset-2 hover:underline">
          ← All projects
        </Link>
      </div>

      <div className="border-b border-rule-gray px-6 pt-8 md:px-10">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <StatusPill status={project.status} />
          {jurisdiction ? (
            <span className="font-mono text-xs tracking-wide text-ink/50 uppercase">
              {jurisdiction.name}, {jurisdiction.state}
            </span>
          ) : null}
        </div>

        <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">{project.name}</h1>

        <ProjectTabs projectId={project.id} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">{props.children}</div>
    </div>
  );
}
