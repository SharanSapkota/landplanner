import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PendingRefresher } from "@/components/documents/pending-refresher";
import { listDocuments, listJurisdictions } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default async function KnowledgePage() {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const jurisdictions = await listJurisdictions(token);
  const kitsap = jurisdictions[0];

  if (!kitsap) {
    return (
      <div className="flex-1 px-6 py-8 md:px-10">
        <p className="font-serif text-sm text-ink/60">No jurisdiction is configured yet.</p>
      </div>
    );
  }

  const documents = await listDocuments(token, { scope: "firm_experience", jurisdictionId: kitsap.id });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <PendingRefresher documents={documents} />

      <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">Firm Knowledge</h1>
      <p className="mt-1 font-mono text-xs tracking-wide text-ink/50 uppercase">
        {kitsap.name}, {kitsap.state}
      </p>
      <p className="mt-4 max-w-2xl font-serif text-sm text-ink/60">
        Your organization&rsquo;s own accumulated experience in this jurisdiction — private to your firm, visible to
        everyone in it.
      </p>

      <section className="mt-6 max-w-2xl">
        <DocumentUploadForm
          scope="firm_experience"
          jurisdictionId={kitsap.id}
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
