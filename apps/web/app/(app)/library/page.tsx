import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PendingRefresher } from "@/components/documents/pending-refresher";
import { JurisdictionFilter } from "@/components/jurisdictions/jurisdiction-filter";
import { listDocuments, listJurisdictions } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export default async function LibraryPage(props: PageProps<"/library">) {
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

  const [rulebookDocs, publicPrecedentDocs] = await Promise.all([
    listDocuments(token, { scope: "rulebook", jurisdictionId: selected.id }),
    listDocuments(token, { scope: "public_precedent", jurisdictionId: selected.id }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <PendingRefresher documents={[...rulebookDocs, ...publicPrecedentDocs]} />

      <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">County Library</h1>
      <JurisdictionFilter jurisdictions={jurisdictions} selectedId={selected.id} action="/library" />

      <section className="mt-10 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">County Rulebook</h2>
        <p className="mt-1 mb-4 font-serif text-sm text-ink/60">
          Official county law and regulations. Shared platform-wide, across every firm.
        </p>

        {session.role === "admin" ? (
          <DocumentUploadForm
            scope="rulebook"
            jurisdictions={jurisdictions}
            defaultJurisdictionId={selected.id}
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
          jurisdictions={jurisdictions}
          defaultJurisdictionId={selected.id}
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
