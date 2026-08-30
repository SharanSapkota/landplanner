import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PendingRefresher } from "@/components/documents/pending-refresher";
import { getProject, listDocuments } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default async function ProjectDetailPage(props: PageProps<"/dashboard/[id]">) {
  const { id } = await props.params;
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const [project, documents] = await Promise.all([
    getProject(token, id),
    listDocuments(token, { scope: "project", projectId: id }),
  ]);

  const createdAt = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <PendingRefresher documents={documents} />

      <dl className="grid grid-cols-1 gap-6 sm:max-w-xl sm:grid-cols-2">
        <div>
          <dt className="font-sans text-xs font-medium tracking-wide text-ink/50 uppercase">Address</dt>
          <dd className="mt-1 font-serif text-base text-ink">{project.address ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-medium tracking-wide text-ink/50 uppercase">Project type</dt>
          <dd className="mt-1 font-serif text-base text-ink">{project.projectType ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-medium tracking-wide text-ink/50 uppercase">Status</dt>
          <dd className="mt-1 font-serif text-base text-ink capitalize">{project.status}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-medium tracking-wide text-ink/50 uppercase">Created</dt>
          <dd className="mt-1 font-serif text-base text-ink">{createdAt}</dd>
        </div>
      </dl>

      <p className="mt-10 max-w-xl font-serif text-sm text-ink/50">
        Client contact details aren&rsquo;t tracked on a project yet.
      </p>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">Documents</h2>
        <p className="mt-1 mb-4 font-serif text-sm text-ink/60">
          Documents specific to this engagement — client submissions, correspondence, plans.
        </p>

        <DocumentUploadForm
          scope="project"
          projectId={project.id}
          revalidateTarget={`/dashboard/${project.id}`}
          docTypePlaceholder="e.g. client_submission, reviewer_letter"
        />

        <div className="mt-4">
          <DocumentList documents={documents} />
        </div>
      </section>
    </div>
  );
}
