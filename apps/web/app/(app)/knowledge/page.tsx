import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PendingRefresher } from "@/components/documents/pending-refresher";
import { JurisdictionFilter } from "@/components/jurisdictions/jurisdiction-filter";
import { listDocuments, listJurisdictions } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export default async function KnowledgePage(props: PageProps<"/knowledge">) {
  const [session, token] = await Promise.all([getSession(), getAccessToken()]);
  if (!session || !token) {
    redirect("/login");
  }

  const jurisdictions = await listJurisdictions(token);

  if (jurisdictions.length === 0) {
    return (
      <div className="flex-1 px-6 py-8 md:px-10">
        <p className="font-serif text-sm text-ink/60">
          No jurisdiction is configured yet.
          {session.role === "admin" ? (
            <>
              {" "}
              <Link href="/admin/jurisdictions" className="text-survey-blue underline-offset-2 hover:underline">
                Create one
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const requestedId = typeof searchParams.jurisdictionId === "string" ? searchParams.jurisdictionId : undefined;
  const selected = jurisdictions.find((j) => j.id === requestedId) ?? jurisdictions[0];

  const documents = await listDocuments(token, { scope: "firm_experience", jurisdictionId: selected.id });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <PendingRefresher documents={documents} />

      <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">Firm Knowledge</h1>
      <p className="mt-4 max-w-2xl font-serif text-sm text-ink/60">
        Your organization&rsquo;s own accumulated experience in the selected jurisdiction — private to your firm, visible
        to everyone in it.
      </p>
      <JurisdictionFilter jurisdictions={jurisdictions} selectedId={selected.id} action="/knowledge" />

      <section className="mt-6 max-w-2xl">
        <DocumentUploadForm
          scope="firm_experience"
          jurisdictions={jurisdictions}
          defaultJurisdictionId={selected.id}
          revalidateTarget="/knowledge"
          docTypePlaceholder="e.g. internal_note, reviewer_letter"
        />

        <div className="mt-4">
          <DocumentList documents={documents} />
        </div>
      </section>
    </div>
  );
}
