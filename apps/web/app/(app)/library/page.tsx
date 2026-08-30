import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PendingRefresher } from "@/components/documents/pending-refresher";
import { listDocuments, listJurisdictions } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export default async function LibraryPage() {
  const [session, token] = await Promise.all([getSession(), getAccessToken()]);
  if (!session || !token) {
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

  const [rulebookDocs, publicPrecedentDocs] = await Promise.all([
    listDocuments(token, { scope: "rulebook", jurisdictionId: kitsap.id }),
    listDocuments(token, { scope: "public_precedent", jurisdictionId: kitsap.id }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <PendingRefresher documents={[...rulebookDocs, ...publicPrecedentDocs]} />

      <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">County Library</h1>
      <p className="mt-1 font-mono text-xs tracking-wide text-ink/50 uppercase">
        {kitsap.name}, {kitsap.state}
      </p>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">County Rulebook</h2>
        <p className="mt-1 mb-4 font-serif text-sm text-ink/60">
          Official county law and regulations. Shared platform-wide, across every firm.
        </p>

        {session.role === "admin" ? (
          <DocumentUploadForm
            scope="rulebook"
            jurisdictionId={kitsap.id}
            revalidateTarget="/library"
            docTypePlaceholder="e.g. official_code"
          />
        ) : (
          <p className="rounded-md border border-rule-gray bg-white/40 px-4 py-3 font-serif text-sm text-ink/60">
            Only an organization admin can upload rulebook documents.
          </p>
        )}

        <div className="mt-4">
          <DocumentList documents={rulebookDocs} />
        </div>
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">Public Precedent</h2>
        <p className="mt-1 mb-4 font-serif text-sm text-ink/60">
          Other firms&rsquo; past projects and public records — informative, but not independently verified.
        </p>

        <DocumentUploadForm
          scope="public_precedent"
          jurisdictionId={kitsap.id}
          revalidateTarget="/library"
          docTypePlaceholder="e.g. permit_application"
        />

        <div className="mt-4">
          <DocumentList documents={publicPrecedentDocs} />
        </div>
      </section>
    </div>
  );
}
